
// Script to create product manager posts for Polygon's DeFi chain launch
import fetch from 'node-fetch';

// Array of product manager posts for Polygon DeFi chain
const polygonPosts = [
  "Excited to share that we're finalizing our roadmap for Polygon's new DeFi chain! What features would you most want to see prioritized in the initial release?",
  
  "Question for DeFi users: What pain points in existing DeFi chains should we absolutely solve with our new Polygon DeFi offering?",
  
  "We're debating between optimizing for transaction speed vs. lower fees on our new DeFi chain. Which would create more value for your use cases?",
  
  "Compatibility question: Should our new DeFi chain prioritize EVM compatibility or explore alternative execution environments for better performance?",
  
  "Our team is researching different consensus mechanisms for the new Polygon DeFi chain. Thoughts on PoS vs. more novel approaches like Optimistic or ZK validation?",
  
  "For DeFi developers: What tooling would make you more likely to build on our new Polygon DeFi chain versus alternatives?",
  
  "Governance models matter! Would you prefer a more decentralized DAO approach for our new chain or a hybrid model with foundation oversight during the early phases?",
  
  "Security vs. speed - finding the right balance for our new DeFi chain. As users, where would you draw the line?",
  
  "We're planning our liquidity bootstrapping strategy. Would you prefer to see us partner with existing protocols or create native liquidity solutions from day one?",
  
  "How important is bridging to other chains in your DeFi experience? We're considering making cross-chain compatibility a core feature rather than an add-on.",
  
  "Naming brainstorm! Our working title is 'Polygon Flux' for our new DeFi-focused chain. Does this resonate, or do you have better suggestions?",
  
  "As we design our token economics, should we focus more on utility or governance rights? Which creates more long-term alignment in your experience?",
  
  "DEX integration is crucial for our DeFi ecosystem. Do you prefer automated market makers or order book models for trading efficiency?",
  
  "When it comes to lending protocols on our new chain, what risk parameters matter most to you as either a borrower or lender?",
  
  "Considering scaling solutions: would you prefer we optimize batch processing for higher throughput or focus on immediate transaction finality?",
  
  "We're designing our developer incentive program for the new Polygon DeFi chain. Should we prioritize hackathon-style grants or ongoing revenue sharing models?",
  
  "For DeFi power users: What analytics and data visualization tools would you want integrated from day one on our new chain?",
  
  "Thinking about UX - should we prioritize building better wallet experiences or focus on protocol-level improvements and let wallet partners build on top?",
  
  "MEV (Maximal Extractable Value) can impact user experience. Should we implement protective measures at the protocol level or keep the chain neutral on this issue?",
  
  "As we finalize our token distribution model, what allocation percentages make sense for: team, investors, community growth, protocol incentives, and ecosystem fund?",
  
  "Curious about your experience with DeFi governance - have you actively participated in voting for changes in other protocols? What would encourage more engagement?"
];

// Function to create a post in Circle 59
async function createPost(content) {
  try {
    const response = await fetch('http://localhost:5000/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content,
        circleId: 59
      }),
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log(`Created post with ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

// Function to create all posts with a delay between each
async function createAllPosts() {
  console.log(`Starting to create ${polygonPosts.length} Polygon PM posts in Circle 59...`);
  
  for (let i = 0; i < polygonPosts.length; i++) {
    try {
      await createPost(polygonPosts[i]);
      console.log(`Created post ${i+1}/${polygonPosts.length}`);
      
      // Add a small delay between posts to avoid overwhelming the server
      if (i < polygonPosts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Failed to create post ${i+1}:`, error);
    }
  }
  
  console.log('Finished creating Polygon PM posts!');
}

// Execute the function
createAllPosts();
