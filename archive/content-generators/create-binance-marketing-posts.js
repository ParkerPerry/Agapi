
// Script to create marketing posts for Binance Chain
import fetch from "node-fetch";

// Array of marketing posts for Binance Chain
const binanceMarketingPosts = [
  "Excited to share that Binance Smart Chain now processes over 10 million daily transactions! Have you experienced the speed and low fees?",
  
  "Did you know Binance Smart Chain hosts over 3,000 dApps? Which BNB Chain applications are you using most frequently?",
  
  "Our latest partnership with major e-commerce brands is bringing real-world utility to BNB Chain. What other industries would you like to see adopt blockchain through Binance?",
  
  "NFT creators on Binance Smart Chain enjoy some of the lowest fees in the industry. What creative projects are you most excited about on our network?",
  
  "Binance Smart Chain's Cross-Chain infrastructure is connecting the entire crypto ecosystem. Which cross-chain features do you find most valuable?",
  
  "Community poll: What's your favorite Binance Chain wallet? Cast your vote and share your experience!",
  
  "Our developer portal just received a major upgrade! Check out the new documentation and resources at docs.bnbchain.org",
  
  "BNB Chain is now securing over $10B in total value locked. Have you staked your BNB tokens yet?",
  
  "Who's joining us at the next Binance Blockchain Week? Share what you're hoping to learn or who you want to meet!",
  
  "We've achieved 40% carbon footprint reduction through our latest eco-friendly initiatives. How important is sustainability to you when choosing a blockchain?",
  
  "New to Binance Smart Chain? Check out our beginner's guide to setting up your wallet and exploring the ecosystem: bnbchain.org/getting-started",
  
  "The future of DeFi is multichain, and BNB Chain is building bridges to all major ecosystems. What DeFi protocols are you using on Binance Smart Chain?",
  
  "Gaming on blockchain is exploding, with BNB Chain hosting over 150 gaming projects. What's your favorite blockchain game on our network?",
  
  "Our token bridging process just got a major speed boost! Transfers now complete in under a minute. Have you tried the improved BNB Bridge?",
  
  "Enterprise adoption update: Over 40 major companies now building on BNB Chain. Which enterprise use cases are you most excited about?",
  
  "Security spotlight: BNB Chain has completed 8 major audits this year with zero critical issues. How important is security when choosing a blockchain?",
  
  "The BNB Chain community has grown to over 1.5 million active wallets! Welcome to all our new users. What brought you to our ecosystem?",
  
  "BNB Smart Chain's layer-2 solution delivers 15x throughput compared to other networks. Developers, what would you build with this performance?",
  
  "Our developer hackathon awarded $300K in prizes last month. Planning to join the next one? What would you build?",
  
  "BNB Chain DAO initiatives have funded 100+ community projects this year. What types of projects would you like to see receive more support?",
  
  "Exciting milestone: BNB Chain has facilitated over $5B in total value locked across our ecosystem. What's your favorite DeFi protocol on Binance?",
];

// Get command line arguments
const args = process.argv.slice(2);
const circleId = args[0] ? parseInt(args[0]) : 438; // Default to 438 if no argument provided
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
    `Starting to create ${binanceMarketingPosts.length} Binance Chain Marketing posts in Circle ${circleId}...`,
  );

  try {
    // Login first to get session cookies
    const cookies = await login();
    console.log("Successfully logged in");

    for (let i = 0; i < binanceMarketingPosts.length; i++) {
      try {
        await createPost(binanceMarketingPosts[i], cookies, circleId);
        console.log(`Created post ${i + 1}/${binanceMarketingPosts.length}`);

        // Add a small delay between posts to avoid overwhelming the server
        if (i < binanceMarketingPosts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to create post ${i + 1}:`, error);
      }
    }

    console.log(`Finished creating Binance Chain Marketing posts in Circle ${circleId}!`);
  } catch (error) {
    console.error("Error in post creation process:", error);
  }
}

// Execute the function
createAllPosts();
