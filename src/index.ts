/*you provided is a TypeScript code that sets up an Express server and defines several routes
for handling HTTP requests. */
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { GHL } from "./ghl";
import * as CryptoJS from 'crypto-js'
import { json } from "body-parser";

const path = __dirname + "/ui/dist/";

dotenv.config();
const app: Express = express();
app.use(json({ type: 'application/json' }))

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
  if (ghl.checkInstallationExists(req.query.companyId as string)) {
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
    }
  }
  return res.send("Installation for this company does not exists");
});

/*`app.get("/example-api-call-location", async (req: Request, res: Response) => { ... })` shows you how you can use ghl object to make get requests
 ghl object in abstract would handle all of the authorization part over here. */
app.get("/example-api-call-location", async (req: Request, res: Response) => {
  /* The line `if(ghl.checkInstallationExists(req.params.locationId)){` is checking if an
    installation already exists for a specific location. It calls the `checkInstallationExists`
    method of the `GHL` class and passes the `locationId` as a parameter. This method checks if
    there is an existing installation for the provided locationId and returns a boolean value
    indicating whether the installation exists or not. */
  try {
    if (ghl.checkInstallationExists(req.params.locationId)) {
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
  const { code, client_id, client_secret, redirect_uri, grant_type } = req.body;
  
  // Validate the authorization code and client credentials
  if (!code || !client_id || !client_secret) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Missing required parameters"
    });
  }
  
  // In a real app, you'd validate the auth code and client credentials
  // For demo purposes, we'll generate tokens
  const accessToken = `access_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  console.log("Token Request:", { code, client_id, grant_type });
  
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
  const { refresh_token, client_id, client_secret, grant_type } = req.body;
  
  if (!refresh_token || grant_type !== "refresh_token") {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Invalid refresh token request"
    });
  }
  
  // In a real app, you'd validate the refresh token
  const newAccessToken = `access_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const newRefreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  console.log("Token Refresh Request:", { refresh_token, client_id });
  
  res.json({
    access_token: newAccessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: newRefreshToken,
    scope: "read write"
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
