/*you provided is a TypeScript code that sets up an Express server and defines several routes
for handling HTTP requests. */
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { GHL } from "./ghl";
import { TokenType, AppUserType } from "./model";
import * as CryptoJS from 'crypto-js'
import { json } from "body-parser";

const path = __dirname + "/ui/dist/";

dotenv.config();
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
app.post("/example-webhook-handler",async (req: Request, res: Response) => {
    console.log(req.body)
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

// Test endpoint to inject mock installation data for testing
app.post("/test-install", async (req: Request, res: Response) => {
  const { companyId, locationId } = req.body;
  
  if (!companyId && !locationId) {
    return res.status(400).json({ error: "Please provide either companyId or locationId" });
  }
  
  const mockInstallation = {
    access_token: `mock_access_token_${Date.now()}`,
    token_type: TokenType.Bearer,
    expires_in: 3600,
    refresh_token: `mock_refresh_token_${Date.now()}`,
    scope: "read write",
    userType: companyId ? AppUserType.Company : AppUserType.Location,
    companyId: companyId || undefined,
    locationId: locationId || undefined,
  };
  
  await ghl.model.saveInstallationInfo(mockInstallation);
  
  res.json({
    success: true,
    message: "Mock installation created successfully",
    resourceId: companyId || locationId,
    installation: mockInstallation
  });
});

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
    const resourceId = userContext.identifiers.companyId || userContext.identifiers.locationId;
    if (resourceId) {
      userContext.installationExists = ghl.checkInstallationExists(resourceId);
      if (userContext.installationExists) {
        userContext.hasValidToken = !!ghl.model.getAccessToken(resourceId);
      }
    }

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

// Debug endpoint to check stored installations
app.get("/debug-installations", (req: Request, res: Response) => {
  res.json({
    installations: ghl.model.installationObjects,
    message: "Current stored installations"
  });
});

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
