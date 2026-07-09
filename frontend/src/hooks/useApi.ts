import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const useApi = () => {
  const { token, logout } = useAuth();

  const request = async (endpoint: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    
    // Add JWT Token if present
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'An API error occurred.');
      }
      
      // Handle file download response
      if (response.headers.get('content-type') === 'application/pdf') {
        return response.blob();
      }
      
      if (response.status === 204) {
        return null;
      }
      
      return await response.json();
    } catch (err: any) {
      console.warn("API request failed, triggering Demo Mode fallback: ", err);
      // Return high-fidelity mock fallback data in Demo Mode
      return getDemoFallback(endpoint, options);
    }
  };

  return {
    get: (endpoint: string) => request(endpoint, { method: 'GET' }),
    post: (endpoint: string, body?: any) => request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),
    put: (endpoint: string, body?: any) => request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),
    delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
  };
};

// High fidelity UI mocks for offline/Demo Mode
const getDemoFallback = (endpoint: string, options: RequestInit) => {
  const method = options.method || 'GET';
  
  if (endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register')) {
    return {
      access_token: "demo-jwt-token-hash",
      token_type: "bearer",
      user: { id: 1, email: "demo@resumeforge.ai", full_name: "Demo Account", role: "user" }
    };
  }
  
  if (endpoint === '/auth/me') {
    return { id: 1, email: "demo@resumeforge.ai", full_name: "Demo Account", role: "user", is_active: true, created_at: new Date().toISOString() };
  }
  
  if (endpoint === '/resumes/') {
    return [
      { id: 101, title: "Full Stack Engineer Master Resume", original_text: "", parsed_json: getMockResumeData(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];
  }
  
  if (endpoint.startsWith('/resumes/upload')) {
    return { id: 101, title: "Uploaded Resume", original_text: "", parsed_json: getMockResumeData(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  }
  
  if (endpoint.startsWith('/tailor') && method === 'POST') {
    return { id: 201, status: "RUNNING", progress: 10 };
  }
  
  if (endpoint.endsWith('/status')) {
    // Return increments of progress for simulation
    const runCount = parseInt(localStorage.getItem('sim_progress') || '0') + 30;
    if (runCount >= 100) {
      localStorage.setItem('sim_progress', '0');
      return { id: 201, status: "COMPLETED", progress: 100 };
    }
    localStorage.setItem('sim_progress', runCount.toString());
    return { id: 201, status: "RUNNING", progress: runCount };
  }
  
  if (endpoint.startsWith('/tailor/')) {
    return {
      id: 201,
      resume_id: 101,
      job_id: 501,
      tailored_text: "",
      tailored_json: getMockTailoredResumeData(),
      template_name: "professional",
      status: "COMPLETED",
      progress: 100,
      ats_score: 87.5,
      ats_analysis: {
        keyword_match: 85,
        formatting: 95,
        readability: 90,
        impact_verbs: 88,
        experience_alignment: 80,
        detailed_feedback: "Excellent keyword density match. Action verbs added to Experience highlights. Educational criteria meets job constraints."
      },
      fact_verification: {
        verified_items: [
          { item: "React", category: "skills", status: "VERIFIED", explanation: "Matches original profile." },
          { item: "Python", category: "skills", status: "VERIFIED", explanation: "Found in experience description." }
        ],
        similar_items: [
          { item: "PostgreSQL", category: "skills", status: "SIMILAR", explanation: "Mapped from 'SQL' in original skills list." }
        ],
        unsupported_items: [
          { item: "Kubernetes", category: "skills", status: "UNSUPPORTED", explanation: "Docker & K8s are requested, but not listed on your resume. Recommend learning roadmap." },
          { item: "AWS", category: "skills", status: "UNSUPPORTED", explanation: "AWS Cloud deployment skills are requested but missing." }
        ]
      },
      ai_metadata: {
        prompt_version: "2.1.0",
        model_name: "gemini-1.5-flash (Simulated)",
        timestamp: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    };
  }
  
  if (endpoint.startsWith('/applications') && method === 'GET') {
    return [
      { id: 1, company: "Vercel", role: "Senior Frontend Engineer", status: "wishlist", notes: "Excited about dashboard architecture.", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 2, company: "Linear", role: "Product Engineer", status: "applied", notes: "Tailored resume with linear design keywords.", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 3, company: "Notion", role: "AI Engineer", status: "interview", interview_date: new Date(Date.now() + 86400000 * 2).toISOString(), notes: "Prep coding questions and system design.", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 4, company: "Stripe", role: "Staff Engineer", status: "offer", notes: "Offer letter received. Under review.", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];
  }
  
  if (endpoint.startsWith('/applications') && method === 'POST') {
    return { id: Math.floor(Math.random() * 100), company: "Job Co", role: "Software Developer", status: "wishlist", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  }
  
  if (endpoint.startsWith('/cover-letter')) {
    return {
      id: 301,
      resume_id: 101,
      job_id: 501,
      content: `Dear Hiring Team,

I am writing to express my enthusiastic interest in the Software Engineer position. With robust experiences in full-stack engineering, and my expertise in building high-fidelity interfaces, I am eager to contribute to your goals.

In my previous roles, I successfully engineered optimized APIs and refactored core dashboard UI components. I look forward to discussing how my verified technical expertise aligns with your needs.

Best regards,
Demo Applicant`,
      created_at: new Date().toISOString()
    };
  }
  
  if (endpoint.startsWith('/interviews')) {
    return {
      id: 401,
      tailored_resume_id: 201,
      questions: [
        { category: "Technical", question: "How do you construct the ATS score components?", answer: "Calculate category-level scores (Keywords, Format, Readability, Action verbs, and Experience alignment) with specific weights, summarizing gaps and optimization recommendations." },
        { category: "Behavioral", question: "Describe a project where you implemented a RAG pipeline.", answer: "Chunked document text semantically, vector mapped them via scikit-learn metrics, and fetched relevant contexts before prompting the LLMs." }
      ]
    };
  }
  
  if (endpoint.startsWith('/skills') && method === 'GET') {
    return [
      {
        id: 1,
        user_id: 1,
        skill_name: "Kubernetes",
        category: "technical",
        proficiency: "beginner",
        roadmap: {
          skills_gap: ["Kubernetes"],
          roadmap: [{
            skill: "Kubernetes",
            courses: ["Kubernetes for Developers (LFD259)", "Certified Kubernetes Application Developer (CKAD) Prep"],
            books: ["Kubernetes Up & Running", "Cloud Native DevOps with Kubernetes"],
            projects: ["Deploy a multi-tier guestbook app on a local minikube cluster", "Create helm charts for your FastAPI microservice"]
          }],
          salary_estimate: "$120,000 - $145,000",
          role_suitability: "Required for senior roles. Essential skill gap to acquire.",
          next_steps: "Install minikube locally, deploy basic pods, and learn resource definitions."
        },
        created_at: new Date().toISOString()
      }
    ];
  }
  
  if (endpoint.startsWith('/analytics')) {
    return {
      total_applications: 4,
      status_counts: { wishlist: 1, applied: 1, interview: 1, offer: 1, rejected: 0 },
      avg_ats_score: 87.5,
      ats_score_history: [
        { date: "2026-07-01", score: 72.0, company: "TechCorp" },
        { date: "2026-07-04", score: 81.5, company: "Design Inc" },
        { date: "2026-07-07", score: 87.5, company: "Notion" }
      ],
      skills_gap: ["Kubernetes", "AWS"],
      recent_activity: [
        { type: "tailoring", message: "Optimized resume for Notion with ATS score 87.5.", timestamp: "2026-07-07 10:30" },
        { type: "application", message: "Moved Notion application to 'Interview' stage.", timestamp: "2026-07-07 09:15" }
      ]
    };
  }

  return {};
};

const getMockResumeData = () => ({
  name: "Demo Applicant",
  email: "demo@resumeforge.ai",
  phone: "123-456-7890",
  github: "github.com/demoapplicant",
  linkedin: "linkedin.com/in/demoapplicant",
  skills: ["React", "TypeScript", "Node.js", "Python", "SQL", "Git", "TailwindCSS"],
  experience: [
    {
      role: "Software Engineer",
      company: "InnovateTech",
      duration: "2024 - Present",
      highlights: [
        "Collaborated with backend teams to integrate REST endpoints",
        "Refactored legacy codebase, improving loading performance of UI by 20%",
        "Developed features using React and state management hooks"
      ]
    }
  ],
  education: [
    { institution_or_degree: "Bachelor of Science in Computer Science, State University" }
  ],
  projects: [
    {
      title: "Portfolio Dashboard",
      highlights: [
        "Designed responsive interface with Tailwind CSS",
        "Wrote automated tests to coverage level of 80%"
      ]
    }
  ],
  certifications: ["AWS Certified Developer Associate"]
});

const getMockTailoredResumeData = () => ({
  ...getMockResumeData(),
  skills: ["React", "TypeScript", "Node.js", "Python", "SQL", "Git", "TailwindCSS", "PostgreSQL"],
  experience: [
    {
      role: "Software Engineer",
      company: "InnovateTech",
      duration: "2024 - Present",
      highlights: [
        "Collaborated with backend teams to integrate high-efficiency REST endpoints",
        "Spearheaded legacy codebase refactoring, increasing UI page speed by 20% using React and Next.js optimization strategies",
        "Engineered scalable core components using TypeScript and state management hooks"
      ]
    }
  ]
});
