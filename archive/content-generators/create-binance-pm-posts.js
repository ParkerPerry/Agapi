
// Script to create product manager posts for Binance Smart Chain
import fetch from "node-fetch";

// Array of product manager posts for Binance Smart Chain
const binancePmPosts = [
  "We're finalizing our roadmap for Binance Smart Chain's upcoming upgrade. What features would you most want to see prioritized in the release?",

  "Question for DeFi users: What pain points in existing DeFi infrastructure should we address with our next BNB Chain update?",

  "We're debating between optimizing for transaction throughput vs. lower fees on BNB Chain. Which would create more value for your use cases?",

  "Compatibility question: Should our next BNB Chain version prioritize EVM compatibility or explore alternative execution environments for better performance?",

  "Our team is researching different consensus mechanisms for future BNB Chain iterations. Thoughts on PoSA vs. more novel approaches?",

  "For blockchain developers: What tooling would make you more likely to build on BNB Chain versus alternatives?",

  "Governance models are evolving - would you prefer a more decentralized DAO approach for BNB Chain or a hybrid model with foundation oversight?",

  "Security vs. speed - finding the right balance for BNB Chain upgrades. As users, where would you draw the line?",

  "We're planning our liquidity enhancement strategy. Would you prefer to see us create incentives for existing protocols or develop native liquidity solutions?",

  "How important is bridging to other networks in your BNB Chain experience? We're considering making cross-chain compatibility a core feature.",

  "Naming brainstorm! We're considering 'BNB Nova' for our new chain implementation. Does this resonate, or do you have better suggestions?",

  "As we design the next iteration of BNB tokenomics, should we focus more on utility, governance rights, or staking incentives?",

  "DEX enhancements are coming to BNB Chain. Do you prefer automated market makers or order book models for trading efficiency?",

  "When it comes to lending protocols on BNB Chain, what risk parameters matter most to you as either a borrower or lender?",

  "Considering scaling solutions: would you prefer we optimize for higher transaction throughput or focus on immediate transaction finality?",

  "We're designing our developer incentive program for the next BNB Chain hackathon. Should we prioritize grants or ongoing revenue sharing models?",

  "For DeFi power users: What analytics and data visualization tools would you want integrated into the BNB Chain ecosystem?",

  "Thinking about UX - should we prioritize building better wallet experiences or focus on protocol-level improvements?",

  "MEV (Maximal Extractable Value) protection is a hot topic. Should we implement protective measures at the protocol level or leave this to builders?",

  "As we finalize our ecosystem fund allocation, what percentages make sense for: team, security, community growth, protocol incentives, and developer grants?",

  "Curious about your experience with on-chain governance - have you actively participated in voting for BNB Chain BEPs? What would encourage more engagement?",
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
    `Starting to create ${binancePmPosts.length} Binance Chain PM posts in Circle ${circleId}...`,
  );

  try {
    // Login first to get session cookies
    const cookies = await login();
    console.log("Successfully logged in");

    for (let i = 0; i < binancePmPosts.length; i++) {
      try {
        await createPost(binancePmPosts[i], cookies, circleId);
        console.log(`Created post ${i + 1}/${binancePmPosts.length}`);

        // Add a small delay between posts to avoid overwhelming the server
        if (i < binancePmPosts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to create post ${i + 1}:`, error);
      }
    }

    console.log(`Finished creating Binance Chain PM posts in Circle ${circleId}!`);
  } catch (error) {
    console.error("Error in post creation process:", error);
  }
}

// Execute the function
createAllPosts();
