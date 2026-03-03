import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Initialize ZAI instance
let zaiInstance: any = null;

async function getZAIInstance() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// POST enhance text using LLM
// Fixed: Uses correct z-ai-web-dev-sdk API structure
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, category } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Use z-ai-web-dev-sdk for LLM
    const zai = await getZAIInstance();

    console.log('ZAI instance created:', !!zai, 'Has chat completions:', !!zai?.chat);

    const systemPrompt = `You are an expert task management and productivity assistant. Your job is to transform basic, rough task descriptions into well-structured, professional, and actionable task descriptions written in FIRST-PERSON perspective.

CRITICAL REQUIREMENTS:
1. Write in FIRST-PERSON perspective (e.g., "Tested", "Converted", "Reviewed", "Created" - NOT "Test", "Convert", "Review", "Create")
2. Use PAST tense for completed actions and PRESENT tense for ongoing/future actions
3. Do NOT just correct grammar - completely rewrite and expand the task
4. Use bullet points (•) for multi-step tasks or when listing action items
5. Add specific, concrete details that would help accomplish the task
6. Include clear next steps or action items when applicable
7. Break down complex tasks into sub-bullets
8. Use professional but clear and concise language
9. If relevant, mention tools, resources, or context needed
10. Add prioritization indicators if appropriate (e.g., "Key deliverables:", "First step:", "Consider:")

ENHANCEMENT EXAMPLES:

Example 1 - Simple task enhancement:
Input: "fix the bug in login page"
Output:
• Tested and resolved the login page authentication bug
  - Reproduced the issue in staging environment
  - Reviewed authentication flow and error logs
  - Implemented and tested the fix
  - Verified with QA team before deploying to production

Example 2 - Meeting task:
Input: "meeting with team about project"
Output:
• Conducted project status meeting with the team
  - Prepared agenda: progress review, blockers, next steps
  - Reviewed current sprint deliverables
  - Identified and documented any blockers or dependencies
  - Assigned action items with clear owners and deadlines

Example 3 - Learning task:
Input: "learn react"
Output:
• Learning and practicing React fundamentals
  - Completing official React tutorial
  - Building 2-3 small projects (to-do app, weather app)
  - Studying hooks, components, and state management
  - Practicing with a mentor or through online courses
  - Goal: Build confidence to contribute to React projects

Example 4 - Documentation task:
Input: "write docs for api"
Output:
• Created comprehensive API documentation
  - Documented all endpoints with request/response examples
  - Added authentication and error handling details
  - Included code samples in multiple languages
  - Set up automated documentation generation

Example 5 - Data task:
Input: "convert csv to json"
Output:
• Converted CSV data to JSON format
  - Parsed CSV file with proper data type handling
  - Structured JSON with nested objects where needed
  - Validated converted data for completeness
  - Saved output with proper formatting and indentation

Always maintain the original intent but significantly improve clarity, structure, and actionability using FIRST-PERSON perspective.`;

    const userPrompt = `Category: ${category || 'General'}

Original task description:
"${text}"

Please transform this into a well-structured, professional task description. Use bullet points, add relevant details, and make it clearly actionable. Return ONLY the enhanced task description, no explanations or meta-commentary.`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      thinking: { type: 'disabled' }
    });

    const enhancedText = completion.choices[0]?.message?.content?.trim() || text;

    return NextResponse.json({
      enhancedText,
      originalText: text
    });
  } catch (error) {
    console.error('Error enhancing text:', error);
    return NextResponse.json(
      { error: 'Failed to enhance text' },
      { status: 500 }
    );
  }
}
