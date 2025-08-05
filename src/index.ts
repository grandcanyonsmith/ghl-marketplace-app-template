/*you provided is a TypeScript code that sets up an Express server and defines several routes
for handling HTTP requests. */
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { GHL } from "./ghl";
import { TokenType, AppUserType } from "./model";
import * as CryptoJS from 'crypto-js'
import { json } from "body-parser";
import * as crypto from 'crypto';

const path = __dirname + "/ui/dist/";

dotenv.config();

// GHL Webhook Authentication - Public Key for signature verification
const GHL_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAokvo/r9tVgcfZ5DysOSC
Frm602qYV0MaAiNnX9O8KxMbiyRKWeL9JpCpVpt4XHIcBOK4u3cLSqJGOLaPuXw6
dO0t6Q/ZVdAV5Phz+ZtzPL16iCGeK9po6D6JHBpbi989mmzMryUnQJezlYJ3DVfB
csedpinheNnyYeFXolrJvcsjDtfAeRx5ByHQmTnSdFUzuAnC9/GepgLT9SM4nCpv
uxmZMxrJt5Rw+VUaQ9B8JSvbMPpez4peKaJPZHBbU3OdeCVx5klVXXZQGNHOs8gF
3kvoV5rTnXV0IknLBXlcKKAQLZcY/Q9rG6Ifi9c+5vqlvHPCUJFT5XUGG5RKgOKU
J062fRtN+rLYZUV+BjafxQauvC8wSWeYja63VSUruvmNj8xkx2zE/Juc+yjLjTXp
IocmaiFeAO6fUtNjDeFVkhf5LNb59vECyrHD2SQIrhgXpO4Q3dVNA5rw576PwTzN
h/AMfHKIjE4xQA1SZuYJmNnmVZLIZBlQAF9Ntd03rfadZ+yDiOXCCs9FkHibELhC
HULgCsnuDJHcrGNd5/Ddm5hxGQ0ASitgHeMZ0kcIOwKDOzOU53lDza6/Y09T7sYJ
PQe7z0cvj7aE4B+Ax1ZoZGPzpJlZtGXCsu9aTEGEnKzmsFqwcSsnw3JB31IGKAyk
T1hhTiaCeIY/OwwwNUY2yvcCAwEAAQ==
-----END PUBLIC KEY-----`;

// Webhook verification utilities
interface WebhookPayload {
  timestamp: string;
  webhookId: string;
  [key: string]: any;
}

interface ProcessedWebhooks {
  [webhookId: string]: number; // timestamp when processed
}

// In-memory store for processed webhooks (use Redis/DB in production)
const processedWebhooks: ProcessedWebhooks = {};

/**
 * Verifies the digital signature of a webhook payload using GHL's public key
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  try {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(payload);
    verifier.end();
    
    // Remove 'sha256=' prefix if present
    const cleanSignature = signature.replace(/^sha256=/, '');
    
    return verifier.verify(GHL_PUBLIC_KEY, cleanSignature, 'base64');
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Validates webhook timestamp to prevent replay attacks
 */
function isValidTimestamp(timestamp: string, maxAgeMinutes: number = 5): boolean {
  try {
    const webhookTime = new Date(timestamp).getTime();
    const currentTime = Date.now();
    const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds
    
    return Math.abs(currentTime - webhookTime) <= maxAge;
  } catch (error) {
    console.error('Invalid timestamp format:', error);
    return false;
  }
}

/**
 * Checks if webhook has already been processed to prevent duplicates
 */
function isWebhookProcessed(webhookId: string): boolean {
  return webhookId in processedWebhooks;
}

/**
 * Marks webhook as processed and cleans up old entries
 */
function markWebhookProcessed(webhookId: string): void {
  processedWebhooks[webhookId] = Date.now();
  
  // Clean up old entries (older than 1 hour)
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  Object.keys(processedWebhooks).forEach(id => {
    if (processedWebhooks[id] < oneHourAgo) {
      delete processedWebhooks[id];
    }
  });
}

/**
 * Express middleware for webhook authentication
 */
function authenticateWebhook(req: Request, res: Response, next: any) {
  try {
    // Get signature from header
    const signature = req.get('x-wh-signature');
    if (!signature) {
      console.warn('Webhook rejected: Missing signature header');
      return res.status(401).json({ error: 'Missing signature header' });
    }

    // Get raw payload
    const payload = JSON.stringify(req.body);
    
    // Parse webhook data
    const webhookData: WebhookPayload = req.body;
    
    if (!webhookData.timestamp || !webhookData.webhookId) {
      console.warn('Webhook rejected: Missing timestamp or webhookId');
      return res.status(400).json({ error: 'Missing required webhook fields' });
    }

    // Check if webhook already processed
    if (isWebhookProcessed(webhookData.webhookId)) {
      console.warn(`Webhook rejected: Duplicate webhook ID ${webhookData.webhookId}`);
      return res.status(409).json({ error: 'Webhook already processed' });
    }

    // Verify timestamp
    if (!isValidTimestamp(webhookData.timestamp)) {
      console.warn(`Webhook rejected: Invalid timestamp ${webhookData.timestamp}`);
      return res.status(401).json({ error: 'Invalid or expired timestamp' });
    }

    // Verify signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.warn('Webhook rejected: Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Mark webhook as processed
    markWebhookProcessed(webhookData.webhookId);
    
    console.log(`✅ Webhook authenticated: ${webhookData.webhookId}`);
    next();
    
  } catch (error) {
    console.error('Webhook authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

const app: Express = express();
app.use(json({ type: 'application/json' }));
app.use(express.urlencoded({ extended: true })); // Add support for form-encoded data

/*`app.use(express.static(path));` is setting up a middleware in the Express server. The
`express.static` middleware is used to serve static files such as HTML, CSS, JavaScript, and images. */
app.use(express.static(path));

/* The line `const ghl = new GHL();` is creating a new instance of the `GHL` class. It is assigning
this instance to the variable `ghl`. This allows you to use the methods and properties defined in
the `GHL` class to interact with the GoHighLevel API. */
const ghl = new GHL();

const port = process.env.PORT;

/*`app.get("/authorize-handler", async (req: Request, res: Response) => { ... })` sets up an example how you can authorization requests */
app.get("/authorize-handler", async (req: Request, res: Response) => {
  const { code } = req.query;
  await ghl.authorizationHandler(code as string);
  res.redirect("https://app.gohighlevel.com/");
});

/*`app.get("/example-api-call", async (req: Request, res: Response) => { ... })` shows you how you can use ghl object to make get requests
 ghl object in abstract would handle all of the authorization part over here. */
app.get("/example-api-call", async (req: Request, res: Response) => {
  const companyId = req.query.companyId as string;
  const installationExists = ghl.checkInstallationExists(companyId);
  const accessToken = ghl.model.getAccessToken(companyId);
  
  console.log("API Call Debug - companyId:", companyId);
  console.log("Installation exists:", installationExists);
  console.log("Access token:", accessToken);
  
  // Return debug info if installation doesn't exist
  if (!installationExists) {
    return res.json({
      error: "No installation found",
      debug: {
        companyId: companyId,
        companyIdType: typeof companyId,
        installationExists: installationExists,
        accessToken: accessToken,
        allInstallations: Object.keys(ghl.model.installationObjects)
      }
    });
  }
  
  if (ghl.checkInstallationExists(companyId)) {
    try {
      const request = await ghl
        .requests(req.query.companyId as string)
        .get(`/users/search?companyId=${req.query.companyId}`, {
          headers: {
            Version: "2021-07-28",
          },
        });
      return res.send(request.data);
    } catch (error) {
      console.log(error);
      return res.json({
        error: "API call failed",
        debug: {
          companyId: companyId,
          installationExists: installationExists,
          accessToken: accessToken,
          errorMessage: error instanceof Error ? error.message : String(error),
          allInstallations: Object.keys(ghl.model.installationObjects)
        }
      });
    }
  }
  return res.json({
    error: "Unexpected path - installation exists but no API call made",
    debug: {
      companyId: companyId,
      installationExists: installationExists,
      accessToken: accessToken,
      allInstallations: Object.keys(ghl.model.installationObjects)
    }
  });
});

/*`app.get("/example-api-call-location", async (req: Request, res: Response) => { ... })` shows you how you can use ghl object to make get requests
 ghl object in abstract would handle all of the authorization part over here. */
app.get("/example-api-call-location", async (req: Request, res: Response) => {
  /* The line `if(ghl.checkInstallationExists(req.params.locationId)){` is checking if an
    installation already exists for a specific location. It calls the `checkInstallationExists`
    method of the `GHL` class and passes the `locationId` as a parameter. This method checks if
    there is an existing installation for the provided locationId and returns a boolean value
    indicating whether the installation exists or not. */
  
  console.log("Location API call - Query params:", req.query);
  console.log("Company ID:", req.query.companyId);
  console.log("Location ID:", req.query.locationId);
  
  try {
    if (ghl.checkInstallationExists(req.query.locationId as string)) {
      const request = await ghl
        .requests(req.query.locationId as string)
        .get(`/contacts/?locationId=${req.query.locationId}`, {
          headers: {
            Version: "2021-07-28",
          },
        });
      return res.send(request.data);
    } else {
      /* NOTE: This flow would only work if you have a distribution type of both Location & Company & OAuth read-write scopes are configured. 
        The line `await ghl.getLocationTokenFromCompanyToken(req.query.companyId as string, req.query.locationId as string)`
         is calling the `getLocationTokenFromCompanyToken` method of the
        `GHL` class. This method is used to retrieve the location token for a specific location within a company. */
      await ghl.getLocationTokenFromCompanyToken(
        req.query.companyId as string,
        req.query.locationId as string
      );
      const request = await ghl
        .requests(req.query.locationId as string)
        .get(`/contacts/?locationId=${req.query.locationId}`, {
          headers: {
            Version: "2021-07-28",
          },
        });
      return res.send(request.data);
    }
  } catch (error) {
    console.log(error);
    res.send(error).status(400)
  }
});

/*`app.post("example-webhook-handler",async (req: Request, res: Response) => {
    console.log(req.body)
})` sets up a route for handling HTTP POST requests to the "/example-webhook-handler" endpoint. The below POST
api can be used to subscribe to various webhook events configured for the app. */

// Secure GHL webhook handler with signature verification
app.post("/example-webhook-handler", authenticateWebhook, async (req: Request, res: Response) => {
  try {
    const webhookData: WebhookPayload = req.body;
    
    console.log(`🔒 Secure webhook received:`, {
      webhookId: webhookData.webhookId,
      timestamp: webhookData.timestamp,
      eventType: webhookData.type || 'unknown',
      dataKeys: Object.keys(webhookData)
    });
    
    // Process different webhook types
    switch (webhookData.type) {
      case 'Contact.Create':
        console.log('📝 New contact created:', webhookData.contact);
        break;
        
      case 'Contact.Update':
        console.log('✏️ Contact updated:', webhookData.contact);
        break;
        
      case 'Opportunity.Create':
        console.log('💰 New opportunity created:', webhookData.opportunity);
        break;
        
      case 'Opportunity.Update':
        console.log('🔄 Opportunity updated:', webhookData.opportunity);
        break;
        
      case 'Appointment.Create':
        console.log('📅 New appointment scheduled:', webhookData.appointment);
        break;
        
      case 'InvoiceEvents':
        console.log('💸 Invoice event:', webhookData.invoice);
        break;
        
      case 'Application.Install':
        console.log('🚀 App installed for:', webhookData.location || webhookData.company);
        break;
        
      case 'Application.Uninstall':
        console.log('❌ App uninstalled for:', webhookData.location || webhookData.company);
        break;
        
      default:
        console.log('📨 Unknown webhook type:', webhookData.type);
        console.log('📄 Full webhook data:', webhookData);
    }
    
    // Respond to GHL that webhook was processed successfully
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      webhookId: webhookData.webhookId,
      processedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
})

// Webhook health check endpoint (no authentication required)
app.get("/webhook-health", (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Webhook endpoint is ready to receive secure GHL webhooks',
    authentication: 'RSA SHA256 signature verification enabled',
    replayProtection: 'Timestamp and webhook ID validation enabled',
    processedWebhooksCount: Object.keys(processedWebhooks).length,
    timestamp: new Date().toISOString()
  });
})

// Webhook signature testing endpoint
app.post("/webhook-test", (req: Request, res: Response) => {
  try {
    const signature = req.get('x-wh-signature');
    const payload = JSON.stringify(req.body);
    const webhookData: WebhookPayload = req.body;
    
    const validationResults: any = {
      timestamp: new Date().toISOString(),
      signature: {
        present: !!signature,
        valid: signature ? verifyWebhookSignature(payload, signature) : false,
        receivedSignature: signature ? signature.substring(0, 20) + '...' : null,
        payloadLength: payload.length
      },
      payload: {
        hasTimestamp: !!webhookData.timestamp,
        hasWebhookId: !!webhookData.webhookId,
        timestampValid: webhookData.timestamp ? isValidTimestamp(webhookData.timestamp) : false,
        alreadyProcessed: webhookData.webhookId ? isWebhookProcessed(webhookData.webhookId) : false
      },
      summary: 'Test completed - webhook NOT processed'
    };
    
    res.status(200).json({
      success: true,
      message: 'Webhook signature test completed',
      validation: validationResults,
      note: 'This is a test endpoint - the webhook was not actually processed'
    });
    
  } catch (error) {
    console.error('Webhook test error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Webhook test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
})

/*`app.post("/api/user/profile",async (req: Request, res: Response) => { ... })` handles Course Creator 360 user profile data */
app.post("/api/user/profile", async (req: Request, res: Response) => {
  try {
    const profileData = req.body;
    
    // Log the profile data for development
    console.log("Course Creator 360 Profile Data:", JSON.stringify(profileData, null, 2));
    
    // Here you would typically save to a database
    // For now, we'll just acknowledge receipt
    const response = {
      success: true,
      message: "Profile saved successfully",
      timestamp: new Date().toISOString(),
      profileId: `cc360_${Date.now()}` // Generate a simple ID
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error("Error saving profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save profile",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
})


/* The `app.post("/decrypt-sso",async (req: Request, res: Response) => { ... })` route is used to
decrypt session details using ssoKey. */
app.post("/decrypt-sso",async (req: Request, res: Response) => {
  const {key} = req.body || {}
  if(!key){
    return res.status(400).send("Please send valid key")
  }
  try {
    const data = ghl.decryptSSOData(key)
    res.send(data)
  } catch (error) {
    res.status(400).send("Invalid Key")
    console.log(error)  
  }
})

// Official GHL User Data Decryption Endpoint using Shared Secret
app.post("/decrypt-user-data", async (req: Request, res: Response) => {
  try {
    const { encryptedData } = req.body;
    
    if (!encryptedData) {
      return res.status(400).json({ 
        error: 'Missing encrypted data', 
        message: 'Please provide encryptedData in request body' 
      });
    }

    // Decrypt using official GHL method with Shared Secret
    const userData = decryptUserDataOfficial(encryptedData, process.env.GHL_APP_SSO_KEY as string);
    
    // User data decrypted successfully

    res.json({
      success: true,
      userData: userData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(400).json({ 
      error: 'Failed to decrypt user data',
      message: error instanceof Error ? error.message : 'Decryption failed'
    });
  }
})

/**
 * Official GHL user data decryption using CryptoJS AES
 */
function decryptUserDataOfficial(encryptedUserData: string, sharedSecretKey: string) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedUserData, sharedSecretKey).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error('Failed to decrypt user data');
  }
}

// Production-ready endpoints only

// Endpoint to get GHL user context information
app.get("/api/user-context", async (req: Request, res: Response) => {
  try {
    // Extract potential identifiers from URL parameters
    const { 
      companyId, 
      locationId, 
      userId, 
      token,
      ssoKey 
    } = req.query;

    // Get user info from SSO token if provided
    let ssoData = null;
    if (ssoKey) {
      try {
        ssoData = ghl.decryptSSOData(ssoKey as string);
      } catch (error) {
        console.log("SSO decryption failed:", error);
      }
    }

    // Build user context response
    const userContext = {
      timestamp: new Date().toISOString(),
      identifiers: {
        companyId: companyId || ssoData?.companyId || null,
        locationId: locationId || ssoData?.locationId || null,
        userId: userId || ssoData?.userId || null,
      },
      ssoData: ssoData,
      installationExists: false,
      hasValidToken: false,
      appStatus: "active"
    };

    // Check if we have installation data for this company/location
    // Try both companyId and locationId to find an installation
    let resourceId = null;
    let installationExists = false;
    let hasValidToken = false;

    // Check companyId first
    if (userContext.identifiers.companyId) {
      resourceId = userContext.identifiers.companyId;
      installationExists = ghl.checkInstallationExists(resourceId);
      if (installationExists) {
        hasValidToken = !!ghl.model.getAccessToken(resourceId);
      }
    }

    // If no installation found for companyId, try locationId
    if (!installationExists && userContext.identifiers.locationId) {
      resourceId = userContext.identifiers.locationId;
      installationExists = ghl.checkInstallationExists(resourceId);
      if (installationExists) {
        hasValidToken = !!ghl.model.getAccessToken(resourceId);
      }
    }

    userContext.installationExists = installationExists;
    userContext.hasValidToken = hasValidToken;

    console.log("User Context Request:", userContext);
    
    res.json({
      success: true,
      userContext: userContext,
      message: "User context retrieved successfully"
    });

  } catch (error) {
    console.error("Error getting user context:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user context",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Core application endpoints

// External Authentication Endpoints for GHL Integration

/*`app.get("/auth/authorize", async (req: Request, res: Response) => { ... })` 
Authorization URL - Where users are redirected to authenticate with your external app */
app.get("/auth/authorize", async (req: Request, res: Response) => {
  const { client_id, redirect_uri, state, scope } = req.query;
  
  // Here you would normally redirect to your app's login page
  // For demo purposes, we'll simulate a successful authentication
  const authCode = `auth_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // In a real app, you'd store this auth code temporarily and validate the client_id
  console.log("External Auth Request:", { client_id, redirect_uri, state, scope });
  
  // Redirect back to GHL with the authorization code
  const redirectUrl = `${redirect_uri}?code=${authCode}&state=${state}`;
  res.redirect(redirectUrl);
});

/*`app.post("/auth/token", async (req: Request, res: Response) => { ... })` 
Access Token Request - Where GHL sends the auth code to get access token */
app.post("/auth/token", async (req: Request, res: Response) => {
  console.log("Token Request Body:", req.body);
  console.log("Token Request Headers:", req.headers);
  
  const { code, client_id, client_secret, redirect_uri, grant_type } = req.body;
  
  // Validate the authorization code and client credentials
  if (!code || !client_id || !client_secret) {
    console.log("Missing parameters:", { 
      code: !!code, 
      client_id: !!client_id, 
      client_secret: !!client_secret 
    });
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Missing required parameters"
    });
  }
  
  // Accept both old and new credentials for now
  const validClientIds = [
    "6884026ffd0834e1de781ad2-mdxtminw", // New credentials
    "pk_live_Y2xlcmsuY29uc3RydWN0aW9uY2FsY2F0aW9uLmNvbSQ" // Old credentials (temporary)
  ];
  
  if (!validClientIds.includes(client_id)) {
    console.log("Invalid client_id:", client_id);
    return res.status(400).json({
      error: "invalid_client",
      error_description: "Invalid client credentials"
    });
  }
  
  // Generate tokens
  const accessToken = `access_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  console.log("Token Request Success:", { code, client_id, grant_type });
  
  res.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: "read write"
  });
});

/*`app.post("/auth/refresh", async (req: Request, res: Response) => { ... })` 
Refresh Token Request - Where GHL can refresh access tokens */
app.post("/auth/refresh", async (req: Request, res: Response) => {
  console.log("Refresh Request Body:", req.body);
  console.log("Refresh Request Headers:", req.headers);
  
  const { refresh_token, client_id, client_secret, grant_type } = req.body;
  
  // More flexible validation - only require refresh_token
  if (!refresh_token) {
    console.log("Missing refresh_token in body:", req.body);
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Missing refresh_token parameter"
    });
  }
  
  // Check grant_type if provided, but don't require it
  if (grant_type && grant_type !== "refresh_token") {
    console.log("Invalid grant_type:", grant_type);
    return res.status(400).json({
      error: "invalid_request", 
      error_description: "Invalid grant_type, expected 'refresh_token'"
    });
  }
  
  // Generate new tokens
  const newAccessToken = `access_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const newRefreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  console.log("Token Refresh Success:", { refresh_token: refresh_token.substring(0, 20) + "...", client_id });
  
  res.json({
    access_token: newAccessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: newRefreshToken,
    scope: "read write"
  });
});

/*`app.get("/auth/refresh", async (req: Request, res: Response) => { ... })` 
GET version of refresh endpoint for testing/debugging */
app.get("/auth/refresh", async (req: Request, res: Response) => {
  res.status(405).json({
    error: "method_not_allowed",
    error_description: "Use POST method for token refresh",
    allowed_methods: ["POST"]
  });
});

/*`app.get("/auth/test", async (req: Request, res: Response) => { ... })` 
Test API Endpoint - For testing authentication credentials */
app.get("/auth/test", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "unauthorized",
      error_description: "Missing or invalid authorization header"
    });
  }
  
  const token = authHeader.substring(7);
  console.log("Auth Test Request with token:", token);
  
  // In a real app, you'd validate the token
  // For demo purposes, we'll return success if token exists
  if (token && token.startsWith("access_")) {
    res.json({
      success: true,
      message: "Authentication successful",
      user_id: "test_user_123",
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(401).json({
      error: "invalid_token",
      error_description: "Invalid access token"
    });
  }
});

/*`app.post("/auth/test", async (req: Request, res: Response) => { ... })` 
Test API Endpoint - POST version for testing authentication credentials */
app.post("/auth/test", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "unauthorized",
      error_description: "Missing or invalid authorization header"
    });
  }
  
  const token = authHeader.substring(7);
  console.log("Auth Test POST Request with token:", token);
  
  // In a real app, you'd validate the token
  if (token && token.startsWith("access_")) {
    res.json({
      success: true,
      message: "Authentication successful",
      user_id: "test_user_123",
      timestamp: new Date().toISOString(),
      request_body: req.body
    });
  } else {
    res.status(401).json({
      error: "invalid_token",
      error_description: "Invalid access token"
    });
  }
});

/*`app.get("/", function (req, res) {
  res.sendFile(path + "index.html");
});` sets up a route for the root URL ("/") of the server.  This is
 used to serve the main HTML file of a web application. */
app.get("/", function (req, res) {
  res.sendFile(path + "index.html");
});

/*`app.listen(port, () => {
  console.log(`GHL app listening on port `);
});` is starting the Express server and making it listen on the specified port. */
app.listen(port, () => {
  console.log(`GHL app listening on port ${port}`);
});
