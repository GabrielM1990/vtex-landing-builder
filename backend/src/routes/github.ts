import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';
import { Block, Landing, GitHubDeployRequest, GitHubDeployResponse, BlockValidationResult } from '../types';

const execAsync = promisify(exec);
const prisma = new PrismaClient();
const router = Router();

// GitHub configuration
const owner = process.env.GITHUB_OWNER || 'your-org-name';
const repo = process.env.GITHUB_REPO || 'your-store-theme';

// Helper function to clean block properties
function cleanBlockProps(props: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  Object.keys(props || {}).forEach(key => {
    const value = props[key];
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const cleanedNested = cleanBlockProps(value as Record<string, unknown>);
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key] = cleanedNested;
      }
      return;
    }
    cleaned[key] = value;
  });
  return cleaned;
}

// Helper function to convert block types from legacy to VTEX compatible
function convertBlockTypes(blocks: Block[]): Block[] {
  return blocks.map(block => {
    if (block.type === 'product-summary.shelf') {
      console.log(`🔄 Converting block type: ${block.type} → shelf`);
      return {
        ...block,
        type: 'shelf'
      };
    }
    return block;
  });
}

// Helper function to validate blocks
function isBlockValid(block: Block): boolean {
  const props = block.props || {};
  switch (block.type) {
    case 'rich-text':
      const text = props.text as string;
      return !!(text && text.trim());
    case 'image':
      const src = props.src as string;
      return !!(src && src.trim() && src !== '');
    case 'info-card':
      const headline = props.headline as string;
      return !!(headline && headline.trim());
    case 'shelf':
      return !!(props.collection);
    default:
      return true;
  }
}

// Helper function to generate blocks content for VTEX (correct structure according to VTEX documentation)
function generateBlocksContent(landing: Landing, templateKey: string): Record<string, any> {
  let blocks: Block[];
  
  try {
    blocks = typeof landing.blocks === 'string' ? JSON.parse(landing.blocks) : landing.blocks;
    // Convert legacy block types to VTEX compatible types
    blocks = convertBlockTypes(blocks);
    console.log('📦 Blocks after conversion:', JSON.stringify(blocks, null, 2));
  } catch (error) {
    console.error('Error parsing blocks:', error);
    blocks = [];
  }
  const validBlocks = blocks.filter(isBlockValid);
  
  // Create blocks array for the main store template
  const storeBlocks: string[] = [];
  
  const blocksContent: Record<string, any> = {};
  
  // Add each block definition following VTEX structure
  validBlocks.forEach((block: Block, index: number) => {
    const cleanedProps = cleanBlockProps(block.props);
    const blockNumber = index + 1;
    
    if (block.type === 'shelf') {
      // Shelf block - CORRECT VTEX structure for product carousel
      const shelfKey = `shelf#landing-${landing.id}-shelf-${blockNumber}`;
      
      // Add shelf directly to store blocks
      storeBlocks.push(shelfKey);
      
      // Shelf configuration
      blocksContent[shelfKey] = {
        props: {
          collection: Number(cleanedProps.collection) || 158,
          maxItems: cleanedProps.maxItems || 8,
          orderBy: cleanedProps.orderBy || "OrderByTopSaleDESC",
          hideUnavailableItems: cleanedProps.hideOutOfStockItems !== false,
          titleText: cleanedProps.titleText || "Productos Destacados",
          showTitle: cleanedProps.showTitle !== false,
          gap: cleanedProps.gap || "space-2",
          itemsPerPage: {
            desktop: (cleanedProps.itemsPerPage as any)?.desktop || 4,
            tablet: (cleanedProps.itemsPerPage as any)?.tablet || 3,
            phone: (cleanedProps.itemsPerPage as any)?.phone || 2
          }
        },
        blocks: ["product-summary.shelf"]
      };
      
    } else if (block.type === 'image') {
      // Image block
      const imageKey = `image#landing-${landing.id}-banner-${blockNumber}`;
      storeBlocks.push(imageKey);
      
      blocksContent[imageKey] = {
        props: {
          src: cleanedProps.src || '',
          alt: cleanedProps.alt || '',
          maxHeight: cleanedProps.maxHeight || 300
        }
      };
      
    } else if (block.type === 'rich-text') {
      // Rich text block
      const textKey = `rich-text#landing-${landing.id}-intro-${blockNumber}`;
      storeBlocks.push(textKey);
      
      blocksContent[textKey] = {
        props: {
          text: cleanedProps.text || `## ${landing.name}\n\n${landing.description || 'Bienvenido a nuestra landing page'}`,
          textAlignment: cleanedProps.textAlignment || "LEFT",
          textColor: cleanedProps.textColor || "#000000",
          fontSize: cleanedProps.fontSize || "16px"
        }
      };
      
    } else {
      // Default block handling
      const blockKey = `${block.type}#landing-${landing.id}-${block.type}-${blockNumber}`;
      storeBlocks.push(blockKey);
      
      blocksContent[blockKey] = {
        props: cleanedProps
      };
    }
  });
  
  // Create final blocksContent with main block first
  const finalBlocksContent: Record<string, any> = {};
  
  // Add main store block FIRST (VTEX requirement)
  finalBlocksContent[`store.custom#${templateKey}`] = {
    blocks: storeBlocks
  };
  
  // Add all other block definitions
  Object.assign(finalBlocksContent, blocksContent);
  
  return finalBlocksContent;
}

// Helper function to update routes.json (internal use only)
function updateRoutes(currentRoutes: Record<string, unknown>, landingId: string, route: string) {
  // Use unique block for each landing
  const newRoute = {
    [`store.custom#landing-${landingId}`]: {
      path: route.startsWith('/') ? route : '/' + route
    }
  };
  return {
    ...currentRoutes,
    ...newRoute
  };
}

// Deploy status endpoint for polling
router.get('/deploy-status/:landingId', async (req: Request, res: Response) => {
  const { landingId } = req.params;
  
  try {
    // For now, return a basic status
    // In a real implementation, you would check actual deploy status from a database or cache
    res.json({
      status: 'completed',
      currentStep: 'Deploy completed',
      waitTimeRemaining: 0,
      success: true,
      message: 'Deploy completed successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Direct deploy endpoint
router.post('/deploy-direct/:landingId', async (req: Request, res: Response) => {
  const logs: string[] = [];
  const { landingId } = req.params;
  
  const addLog = (message: string) => {
    logs.push(message);
    console.log(message);
  };
  
  try {
    addLog(`🚀 Starting direct deploy for landing ${landingId} to workspace customlanding`);
    
    // Get landing from database
    const landingData = await prisma.landing.findUnique({
      where: { id: landingId },
    });
    
    if (!landingData) {
      return res.status(404).json({ error: 'Landing not found' });
    }

    // Convert landing data to proper Landing type
    const landing: Landing = {
      ...landingData,
      blocks: typeof landingData.blocks === 'string' ? JSON.parse(landingData.blocks) : landingData.blocks,
      status: landingData.status as 'draft' | 'deployed',
      deployedAt: landingData.deployedAt || undefined,
    };
    
    // Create temp directory (persistent for debugging)
    let tempDir: string = '';
    
    try {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vtex-deploy-'));
      console.log(`📁 Created temp directory: ${tempDir}`);
      console.log(`🔍 DEBUG: This directory will NOT be deleted for inspection`);
      console.log(`📂 You can explore the structure at: ${tempDir}`);
    
      // Clone repository
      addLog(`📥 Cloning repository...`);
      const { stdout: cloneOut } = await execAsync(
        `git clone https://github.com/${owner}/${repo}.git .`,
        { cwd: tempDir, timeout: 60000 }
      );
      addLog('✅ Repository cloned');
    
      // Read current files from cloned repo
      const storeDir = path.join(tempDir, 'store');
      const routesPath = path.join(storeDir, 'routes.json');
      const currentRoutes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
      
      // Generate landing files - Handle problematic landing IDs
      const jsonBlocksFileName = `landing-${landingId}.jsonc`;
      
      // Use unique template key for each landing to avoid conflicts
      const safeTemplateKey = `landing-${landingId}`;
      const blocksContent = generateBlocksContent(landing, safeTemplateKey);
      
      // Write blocks and routes
      const blocksPath = path.join(storeDir, `blocks/${jsonBlocksFileName}`);
      console.log(`📝 Writing blocks file: ${blocksPath}`);
      fs.writeFileSync(blocksPath, JSON.stringify(blocksContent, null, 2));
      console.log(`📝 Blocks content preview:`, JSON.stringify(blocksContent, null, 2).substring(0, 500) + '...');
      
      console.log(`📝 Writing routes file: ${routesPath}`);
      const updatedRoutes = updateRoutes(currentRoutes, landingId, landing.route);
      fs.writeFileSync(routesPath, JSON.stringify(updatedRoutes, null, 2));
      console.log(`📝 Routes content:`, JSON.stringify(updatedRoutes, null, 2));
      
      console.log(`✅ Files written`);
      console.log(`📁 DEBUG: Check these files:`);
      console.log(`   📄 Blocks: ${blocksPath}`);
      console.log(`   🛣️  Routes: ${routesPath}`);
      console.log(`🔍 Open in Explorer: explorer ${tempDir}`);
      
      // VTEX credentials with validation
      const vtexAccount = req.body.vtexAccount || process.env.VTEX_ACCOUNT || 'tiendauno';
      const vtexAppKey = req.body.vtexAppKey || process.env.VTEX_APP_KEY;
      const vtexAppToken = req.body.vtexAppToken || process.env.VTEX_APP_TOKEN;
      const workspace = 'customlanding';

      // Validate VTEX credentials
      if (!vtexAppKey || !vtexAppToken) {
        return res.status(400).json({
          success: false,
          error: 'VTEX credentials are required. Please provide VTEX_APP_KEY and VTEX_APP_TOKEN.',
          logs: logs
        });
      }
      
      // Declare variables outside try block for catch access
      let previewUrl = '';
      let linkSuccess = false;
      
      // Configure VTEX session
      const vtexDir = path.join(process.env.USERPROFILE || '', '.vtex');
      if (!fs.existsSync(vtexDir)) {
        fs.mkdirSync(vtexDir, { recursive: true });
      }
      
      const sessionData = {
        account: vtexAccount,
        login: 'automation',
        token: vtexAppToken,
        workspace,
      };
      fs.writeFileSync(
        path.join(vtexDir, 'session.json'),
        JSON.stringify(sessionData)
      );
      addLog('🔧 VTEX authentication configured');
      
      // Read and set unique manifest version using timestamp
      const manifestPath = path.join(tempDir, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const currentVersion = manifest.version;
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      const hour = now.getHours();
      const minute = now.getMinutes();
      const second = now.getSeconds();
      const uniquePatch = String((dayOfYear * 10000) + (hour * 100) + minute).padStart(6, '0') + String(second).padStart(2, '0');
      manifest.version = `5.${now.getFullYear()}.${uniquePatch}`;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      addLog(`📦 Version set: ${currentVersion} → ${manifest.version}`);
      
      // Execute VTEX commands in sequence
      addLog(`🔐 Executing VTEX deploy sequence step by step...`);
      
      const execOptions = {
        cwd: tempDir,
        env: {
          ...process.env,
          VTEX_APP_KEY: vtexAppKey,
          VTEX_APP_TOKEN: vtexAppToken,
        },
        maxBuffer: 50 * 1024 * 1024,
      };
      
      // Step 1: Login
      addLog(`Step 1/5: VTEX Login...`);
      try {
        const { stdout } = await execAsync(`vtex login ${vtexAccount}`, {
          ...execOptions,
          timeout: 60000,
        });
        if (stdout) logs.push(...stdout.split('\n').filter(line => line.trim()));
        addLog('✅ Step 1: Login completed');
      } catch (error: any) {
        addLog(`⚠️ Step 1 warning: ${error.message}`);
        if (error.stdout) logs.push(...error.stdout.split('\n').filter((line: string) => line.trim()));
      }
      
      // Step 2: Switch workspace
      addLog(`Step 2/5: Switching to workspace ${workspace}...`);
      try {
        const { stdout } = await execAsync(`vtex workspace use ${workspace}`, {
          ...execOptions,
          timeout: 30000,
        });
        if (stdout) logs.push(...stdout.split('\n').filter(line => line.trim()));
        addLog(`✅ Step 2: Using workspace ${workspace}`);
      } catch (error: any) {
        addLog(`⚠️ Step 2 warning: ${error.message}`);
        if (error.stdout) logs.push(...error.stdout.split('\n').filter((line: string) => line.trim()));
      }
      
      // Step 3: Link (simple and direct)
      addLog(`Step 3/3: Linking app to workspace ${workspace}...`);
      
      // List files that will be deployed
      console.log(`📦 Files to be deployed from: ${tempDir}`);
      const deployFiles = await execAsync('dir /s /b', { ...execOptions, timeout: 30000 });
      console.log(`📋 Files list:`, deployFiles.stdout);
      
      try {
        const { stdout } = await execAsync(
          `vtex link`,
          {
            ...execOptions,
            timeout: 120000, // 2 minutes
          }
        );
        if (stdout) {
          logs.push(...stdout.split('\n').filter(line => line.trim()));
          if (stdout.includes('App linked successfully') || stdout.includes('linked successfully') || stdout.includes('Store live at:')) {
            linkSuccess = true;
            addLog('✅ Step 3: App linked successfully');
            
            // Extract the store URL from the output
            const storeUrlMatch = stdout.match(/Store live at:\s*(https:\/\/[^\s]+)/);
            if (storeUrlMatch) {
              previewUrl = storeUrlMatch[1];
              addLog(`🌐 Store URL: ${previewUrl}`);
            }
          } else {
            addLog('⚠️ Step 3: Link may have completed without clear success');
            linkSuccess = true; // Assume success if no explicit error
          }
        }
      } catch (error: any) {
        // Check if vtex link actually succeeded despite the error
        const output = error.stdout || '';
        logs.push(...output.split('\n').filter((line: string) => line.trim()));
        
        if (output.includes('App linked successfully') || output.includes('Store live at:')) {
          linkSuccess = true;
          addLog('✅ Step 3: App linked successfully (despite process termination)');
          
          // Extract the store URL from the output
          const storeUrlMatch = output.match(/Store live at:\s*(https:\/\/[^\s]+)/);
          if (storeUrlMatch) {
            previewUrl = storeUrlMatch[1];
            addLog(`🌐 Store URL: ${previewUrl}`);
          }
          addLog(`ℹ️ Note: Process terminated with SIGTERM but deploy completed successfully`);
        } else {
          addLog(`❌ Step 3 failed: vtex link`);
          addLog(`Link output: ${output}`);
          throw error;
        }
      }
      
      if (linkSuccess) {
        addLog('✅ VTEX link sequence completed successfully');
      } else {
        addLog('⚠️ VTEX link sequence completed - Link uncertain');
      }
      
      // Store URL for the landing
      if (!previewUrl) {
        previewUrl = `https://${workspace}--${vtexAccount}.myvtex.com${landing.route.startsWith('/') ? landing.route : '/' + landing.route}`;
      }
      
      // Update landing status
      await prisma.landing.update({
        where: { id: landing.id },
        data: {
          status: 'deployed',
          deployedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      
      addLog(`🎉 Deploy completed! Preview: ${previewUrl}`);
      
      return res.json({
        success: true,
        message: 'Direct deploy completed',
        landingId,
        workspace,
        previewUrl,
        logs,
        tempDir, // For debugging
      });
      
    } catch (innerError: any) {
      addLog(`❌ Error during deployment process: ${innerError.message}`);
      throw innerError;
    }
    
  } catch (error: any) {
    console.error('Deploy error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      logs,
    });
  }
});

export { router as githubRouter };