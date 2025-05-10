
// Script to create marketing posts for Polygon
import fetch from "node-fetch";

// Array of marketing posts for Polygon
const polygonMarketingPosts = [
  "Excited to share that our Polygon ecosystem now supports over 5,000 dApps! Which ones are you using the most?",
  
  "Did you know Polygon processes more daily transactions than Ethereum mainnet? Our scalability solutions are powering the future of Web3.",
  
  "Our latest partnership with major brands is bringing mainstream adoption to Web3. What other industries would you like to see embrace blockchain through Polygon?",
  
  "NFT creators on Polygon save millions in gas fees compared to other chains. What creative projects are you minting on our network?",
  
  "Polygon's zero-knowledge technology is revolutionizing blockchain privacy and scalability. What use cases are you most excited about?",
  
  "Community poll: What's your favorite Polygon wallet? Cast your vote and share your experience!",
  
  "Our developer resources just got a major upgrade! Check out the new documentation portal at docs.polygon.technology",
  
  "Polygon zkEVM is now processing over 1M transactions daily. Have you experienced the speed and security advantages yet?",
  
  "Who's joining us at the next Polygon Connect event? Share what you're hoping to learn or who you want to meet!",
  
  "We've reduced our carbon footprint by 95% this quarter through innovative sustainability initiatives. How important is eco-friendly blockchain to you?",
  
  "New to Polygon? Check out our beginner's guide to setting up your wallet and exploring the ecosystem: polygon.technology/get-started",
  
  "The future of DeFi is multichain, and Polygon is leading the way with our suite of scaling solutions. What DeFi protocols are you using on Polygon?",
  
  "Gaming on blockchain is exploding, with Polygon hosting over 200 gaming projects. What's your favorite blockchain game on our network?",
  
  "Our token bridging process just got a major speed boost! Transfers now complete in under 2 minutes. Have you tried the improved bridge?",
  
  "Enterprise adoption update: Over 50 major companies now building on Polygon. Which enterprise use cases are you most excited about?",
  
  "Security spotlight: Polygon has completed 12 major audits this year with zero critical issues. How important is security when choosing a blockchain?",
  
  "The Polygon community has grown to over 2 million active wallets! Welcome to all our new users. What brought you to our ecosystem?",
  
  "Polygon's MIDEN ZK-rollup solution delivers 20x throughput compared to other L2s. Developers, what would you build with this performance?",
  
  "Our developer hackathon awarded $500K in prizes last month. Planning to join the next one? What would you build?",
  
  "Polygon DAO initiatives have funded 150+ community projects this year. What types of projects would you like to see receive more support?",
  
  "Exciting milestone: Polygon has facilitated over $10B in total value locked across our ecosystem. What's your favorite DeFi protocol on Polygon?",
];

// Get command line arguments
const args = process.argv.slice(2);
const circleId = args[0] ? parseInt(args[0]) : 440; // Default to 440 if no argument provided
const username = args[1] || "shai1"; // Default username
const password = args[2] || "shai1"; // Default password

// Function to login and get session cookie
async function login() {
  try {
    console.log(`Logging in as ${username}...`);
    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed with status: ${response.status}`);
    }

    // Extract cookies from response
    const cookies = response.headers.raw()["set-cookie"];
    return cookies;
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
}

// Function to create a post in the specified circle
async function createPost(content, cookies, circleId) {
  try {
    const response = await fetch("http://localhost:5000/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookies.join("; "),
      },
      body: JSON.stringify({
        content: content,
        circleId: circleId,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed with status ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log(`Created post with ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

// Function to create all posts with a delay between each
async function createAllPosts() {
  console.log(
    `Starting to create ${polygonMarketingPosts.length} Polygon Marketing posts in Circle ${circleId}...`,
  );

  try {
    // Login first to get session cookies
    const cookies = await login();
    console.log("Successfully logged in");

    for (let i = 0; i < polygonMarketingPosts.length; i++) {
      try {
        await createPost(polygonMarketingPosts[i], cookies, circleId);
        console.log(`Created post ${i + 1}/${polygonMarketingPosts.length}`);

        // Add a small delay between posts to avoid overwhelming the server
        if (i < polygonMarketingPosts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to create post ${i + 1}:`, error);
      }
    }

    console.log(`Finished creating Polygon Marketing posts in Circle ${circleId}!`);
  } catch (error) {
    console.error("Error in post creation process:", error);
  }
}

// Execute the function
createAllPosts();
