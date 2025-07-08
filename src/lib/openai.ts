const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found. AI features will be disabled.');
}

export interface JobKeyword {
  keyword: string;
  status: 'Present' | 'Missing';
}

export interface AnalysisResult {
  match_summary: string;
  match_score: string; // e.g., "72/100"
  job_keywords_detected: JobKeyword[];
  gaps_and_suggestions: string[];
  ats_compatibility?: {
    score: number;
    summary: string;
    issues: string[];
    suggestions: string[];
  };
  impact_statement_review?: {
    score: number;
    summary: string;
    weak_statements: string[];
    suggestions: string[];
  };
  skills_gap_assessment?: {
    score: number;
    summary: string;
    missing_skills: string[];
    suggestions: string[];
  };
  format_optimization?: {
    score: number;
    summary: string;
    issues: string[];
    suggestions: string[];
  };
  career_story_flow?: {
    score: number;
    summary: string;
    issues: string[];
    suggestions: string[];
  };
}

export interface TailoredResumeResult {
  tailored_resume: string;
  improvements: string[];
}

export interface CoverLetterResult {
  cover_letter: string;
  key_points: string[];
}

// Helper function to extract JSON from markdown code blocks
const extractJsonFromMarkdown = (text: string): string => {
  // Remove markdown code block delimiters if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  
  // If no code block found, return the original text (it might already be clean JSON)
  return text.trim();
};

export const analyzeResume = async (
  resumeText: string,
  jobDescription: string,
  selectedAnalysisTypes: string[] = []
): Promise<AnalysisResult> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
    You are an expert resume reviewer and job match analyst.

    Given the following **resume** and **job description**, perform the following tasks:

    1. Extract the most relevant **keywords** from the job description.
    2. Check if these keywords are present in the resume.
    3. Identify key **skills or qualifications** that are missing or weakly represented in the resume.
    4. Provide a brief **summary** on how well the resume matches the job.
    5. Give a **match score out of 100** based on relevance and completeness.
    
    ${selectedAnalysisTypes.length > 0 ? `
    Additionally, perform these specific analyses:
    ${selectedAnalysisTypes.includes('ats_compatibility') ? `
    6. ATS COMPATIBILITY CHECK: Analyze if the resume will pass Applicant Tracking Systems. Check for:
       - Standard section headings
       - Proper formatting
       - Keyword density
       - File format compatibility
       - Parsing issues
    ` : ''}
    ${selectedAnalysisTypes.includes('impact_statement_review') ? `
    7. IMPACT STATEMENT REVIEW: Evaluate the strength of accomplishments and achievements:
       - Identify weak or vague statements
       - Look for quantified results
       - Assess action verbs usage
       - Check for specific examples
    ` : ''}
    ${selectedAnalysisTypes.includes('skills_gap_assessment') ? `
    8. SKILLS GAP ASSESSMENT: Compare candidate skills to job requirements:
       - Identify missing technical skills
       - Assess soft skills alignment
       - Check certification requirements
       - Evaluate experience level match
    ` : ''}
    ${selectedAnalysisTypes.includes('format_optimization') ? `
    9. FORMAT OPTIMIZATION: Review resume formatting and structure:
       - Section organization
       - Visual hierarchy
       - Length appropriateness
       - Professional appearance
    ` : ''}
    ${selectedAnalysisTypes.includes('career_story_flow') ? `
    10. CAREER STORY FLOW: Analyze career progression narrative:
        - Logical career progression
        - Consistency in roles
        - Gap explanations
        - Overall coherence
    ` : ''}
    ` : ''}

    RESUME:
    ${resumeText}

    JOB DESCRIPTION:
    ${jobDescription}

    Please provide a JSON response with the following structure${selectedAnalysisTypes.length > 0 ? ' (include additional analysis sections as requested)' : ''}:
    {
      "match_summary": "Short paragraph summarizing the overall compatibility",
      "match_score": "XX/100",
      "job_keywords_detected": [
        {"keyword": "JavaScript", "status": "Present"},
        {"keyword": "React", "status": "Missing"},
        ...
      ],
      "gaps_and_suggestions": [
        "The resume lacks mention of specific skill/requirement",
        "Add more emphasis on relevant experience/project",
        "Consider highlighting certification/tool if available",
        ...
      ]${selectedAnalysisTypes.includes('ats_compatibility') ? `,
      "ats_compatibility": {
        "score": 7,
        "summary": "Brief summary of ATS compatibility",
        "issues": ["Issue 1", "Issue 2"],
        "suggestions": ["Suggestion 1", "Suggestion 2"]
      }` : ''}${selectedAnalysisTypes.includes('impact_statement_review') ? `,
      "impact_statement_review": {
        "score": 6,
        "summary": "Brief summary of impact statements",
        "weak_statements": ["Weak statement 1", "Weak statement 2"],
        "suggestions": ["Suggestion 1", "Suggestion 2"]
      }` : ''}${selectedAnalysisTypes.includes('skills_gap_assessment') ? `,
      "skills_gap_assessment": {
        "score": 5,
        "summary": "Brief summary of skills gaps",
        "missing_skills": ["Skill 1", "Skill 2"],
        "suggestions": ["Suggestion 1", "Suggestion 2"]
      }` : ''}${selectedAnalysisTypes.includes('format_optimization') ? `,
      "format_optimization": {
        "score": 8,
        "summary": "Brief summary of format issues",
        "issues": ["Issue 1", "Issue 2"],
        "suggestions": ["Suggestion 1", "Suggestion 2"]
      }` : ''}${selectedAnalysisTypes.includes('career_story_flow') ? `,
      "career_story_flow": {
        "score": 7,
        "summary": "Brief summary of career story flow",
        "issues": ["Issue 1", "Issue 2"],
        "suggestions": ["Suggestion 1", "Suggestion 2"]
      }` : ''}
    }

    Be concise but insightful. Write in plain, helpful English.
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume analyzer. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.0,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const rawContent = data.choices[0].message.content;
  
  // Extract clean JSON from potential markdown wrapper
  const cleanJson = extractJsonFromMarkdown(rawContent);
  
  try {
    return JSON.parse(cleanJson);
  } catch (parseError) {
    console.error('Failed to parse JSON:', cleanJson);
    throw new Error('Invalid JSON response from AI. Please try again.');
  }
};

export const generateTailoredResume = async (
  resumeText: string,
  jobDescription: string
): Promise<TailoredResumeResult> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
    Please create a tailored resume based on the original resume and job description:

    ORIGINAL RESUME:
    ${resumeText}

    JOB DESCRIPTION:
    ${jobDescription}

    Please provide a JSON response with the following structure:
    {
      "tailored_resume": "Complete tailored resume text here",
      "improvements": ["improvement1", "improvement2", ...]
    }

    The tailored resume should:
    - Emphasize relevant skills and experience
    - Use keywords from the job description
    - Restructure content to match job requirements
    - Maintain professional formatting
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume writer. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const rawContent = data.choices[0].message.content;
  
  // Extract clean JSON from potential markdown wrapper
  const cleanJson = extractJsonFromMarkdown(rawContent);
  
  try {
    return JSON.parse(cleanJson);
  } catch (parseError) {
    console.error('Failed to parse JSON:', cleanJson);
    throw new Error('Invalid JSON response from AI. Please try again.');
  }
};

export const generateCoverLetter = async (
  resumeText: string,
  jobDescription: string
): Promise<CoverLetterResult> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
    Please create a professional cover letter based on the resume and job description:

    RESUME:
    ${resumeText}

    JOB DESCRIPTION:
    ${jobDescription}

    Please provide a JSON response with the following structure:
    {
      "cover_letter": "Complete professional cover letter text here",
      "key_points": ["key point 1", "key point 2", ...]
    }

    The cover letter should:
    - Be professional and engaging
    - Highlight relevant experience from the resume
    - Address specific requirements from the job description
    - Show enthusiasm for the role and company
    - Be concise but compelling (3-4 paragraphs)
    - Include proper salutation and closing
    - Use keywords from the job description naturally
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert cover letter writer. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const rawContent = data.choices[0].message.content;
  
  // Extract clean JSON from potential markdown wrapper
  const cleanJson = extractJsonFromMarkdown(rawContent);
  
  try {
    return JSON.parse(cleanJson);
  } catch (parseError) {
    console.error('Failed to parse JSON:', cleanJson);
    throw new Error('Invalid JSON response from AI. Please try again.');
  }
};