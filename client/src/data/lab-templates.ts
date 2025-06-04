import { InsertLabTemplate } from "@shared/schema";

/**
 * Predefined lab templates for common experiment types
 * These templates provide standard goals and metrics for different experiment categories
 */
export const predefinedLabTemplates: Omit<InsertLabTemplate, "isDefault">[] = [
  // Product Development Templates
  {
    name: "Feature Adoption Test",
    description: "Test adoption and usability of a new feature to determine if it should be fully deployed",
    category: "product",
    experimentType: "single_variant",
    goals: "Determine if the new feature improves user engagement and satisfaction without negatively impacting existing workflows. Identify any usability issues and gather feedback for improvements.",
    successMetrics: {
      metrics: [
        {
          name: "Feature Usage Rate",
          target: "30% of users in first week",
          priority: "high"
        },
        {
          name: "Task Completion Rate",
          target: "85% success rate",
          priority: "high"
        },
        {
          name: "User Satisfaction",
          target: "+10 points in satisfaction survey",
          priority: "medium"
        },
        {
          name: "Time on Task",
          target: "15% reduction",
          priority: "low"
        }
      ]
    }
  },
  {
    name: "UI Enhancement Test",
    description: "Compare a new UI design against the current version to measure impact on usability and engagement",
    category: "product",
    experimentType: "a_b_test",
    goals: "Evaluate if the new UI design improves user experience, increases engagement metrics, and reduces friction points. Gather qualitative feedback on visual appeal and intuitiveness.",
    successMetrics: {
      metrics: [
        {
          name: "Page Engagement Time",
          target: "+15% increase",
          priority: "high"
        },
        {
          name: "Click-through Rate",
          target: "+10% increase",
          priority: "high"
        },
        {
          name: "User Error Rate",
          target: "-20% reduction",
          priority: "medium"
        },
        {
          name: "Visual Appeal Rating",
          target: "8/10 or higher",
          priority: "medium"
        }
      ]
    }
  },
  
  // Marketing Templates
  {
    name: "Messaging Effectiveness",
    description: "Test different messaging approaches to determine which resonates best with target audience",
    category: "marketing",
    experimentType: "a_b_test",
    goals: "Identify the messaging style, tone, and content that generates the highest engagement and conversion rates. Understand which value propositions resonate most with different audience segments.",
    successMetrics: {
      metrics: [
        {
          name: "Conversion Rate",
          target: "+5% increase",
          priority: "high"
        },
        {
          name: "Engagement Rate",
          target: "+12% increase",
          priority: "high"
        },
        {
          name: "Message Recall",
          target: "65% or higher",
          priority: "medium"
        },
        {
          name: "Brand Perception",
          target: "+10% positive sentiment",
          priority: "medium"
        }
      ]
    }
  },
  {
    name: "Call-to-Action Optimization",
    description: "Test variations of CTA buttons, text, and placement to maximize conversion",
    category: "marketing",
    experimentType: "a_b_test",
    goals: "Determine the optimal combination of CTA elements (color, text, size, position) that maximizes click-through and conversion rates. Identify if different CTAs perform better for different user segments.",
    successMetrics: {
      metrics: [
        {
          name: "CTA Click Rate",
          target: "+25% increase",
          priority: "high"
        },
        {
          name: "Conversion Rate",
          target: "+10% increase",
          priority: "high"
        },
        {
          name: "Time to Click",
          target: "-20% reduction",
          priority: "medium"
        },
        {
          name: "Bounce Rate",
          target: "-15% reduction",
          priority: "low"
        }
      ]
    }
  },
  
  // Content Templates
  {
    name: "Content Format Test",
    description: "Compare different content formats (video, article, infographic) to determine most effective for your audience",
    category: "content",
    experimentType: "a_b_test",
    goals: "Identify which content format drives the highest engagement, sharing, and retention metrics. Understand format preferences across different collectives and use cases.",
    successMetrics: {
      metrics: [
        {
          name: "Time on Content",
          target: "+30% increase",
          priority: "high"
        },
        {
          name: "Content Completion Rate",
          target: "75% or higher",
          priority: "high"
        },
        {
          name: "Share/Save Rate",
          target: "+20% increase",
          priority: "medium"
        },
        {
          name: "Return Visit Rate",
          target: "+15% increase",
          priority: "medium"
        }
      ]
    }
  },
  {
    name: "Topic Interest Analysis",
    description: "Test different content topics to identify what your audience finds most valuable",
    category: "content",
    experimentType: "exploration",
    goals: "Discover which content topics generate the most interest, engagement, and sharing behavior. Map topic preferences to different audience segments for future content strategy.",
    successMetrics: {
      metrics: [
        {
          name: "Click-through Rate",
          target: "+20% above average",
          priority: "high"
        },
        {
          name: "Content Engagement Score",
          target: "7/10 or higher",
          priority: "high"
        },
        {
          name: "Comment Frequency",
          target: "+25% increase",
          priority: "medium"
        },
        {
          name: "Follow-up Content Views",
          target: "+15% increase",
          priority: "medium"
        }
      ]
    }
  },
  
  // Engagement Templates
  {
    name: "Community Interaction Pattern",
    description: "Test different community interaction formats to increase member engagement",
    category: "engagement",
    experimentType: "a_b_test",
    goals: "Identify which interaction formats and mechanisms drive the highest quality engagement and peer-to-peer connections. Determine optimal frequency and types of prompts to sustain engagement.",
    successMetrics: {
      metrics: [
        {
          name: "Active Participation Rate",
          target: "+25% increase",
          priority: "high"
        },
        {
          name: "Quality of Interaction",
          target: "8/10 average rating",
          priority: "high"
        },
        {
          name: "Repeat Participation",
          target: "70% within 7 days",
          priority: "medium"
        },
        {
          name: "New Connection Formation",
          target: "+15% increase",
          priority: "medium"
        }
      ]
    }
  },
  {
    name: "Gamification Elements Test",
    description: "Test the impact of different gamification elements on user engagement and retention",
    category: "engagement",
    experimentType: "a_b_test",
    goals: "Evaluate which gamification elements (points, badges, leaderboards, challenges) most effectively drive user engagement, repeat visits, and desired behaviors. Determine which elements appeal to different collectives.",
    successMetrics: {
      metrics: [
        {
          name: "Feature Interaction Rate",
          target: "+40% increase",
          priority: "high"
        },
        {
          name: "Return Visit Frequency",
          target: "+25% increase",
          priority: "high"
        },
        {
          name: "Session Duration",
          target: "+15% increase",
          priority: "medium"
        },
        {
          name: "Desired Action Completion",
          target: "+30% increase",
          priority: "medium"
        }
      ]
    }
  }
];

/**
 * Get templates by category
 * @param category The category to filter by
 * @returns Array of templates matching the category
 */
export function getTemplatesByCategory(category: InsertLabTemplate["category"]) {
  return predefinedLabTemplates.filter(template => template.category === category);
}

/**
 * Get a template by name
 * @param name The template name to find
 * @returns The matching template or undefined if not found
 */
export function getTemplateByName(name: string) {
  return predefinedLabTemplates.find(template => template.name === name);
}

/**
 * Default export of all lab templates
 */
export default predefinedLabTemplates;