import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const API_KEYS = [
  'AIzaSyC81GKbsuTg8lGzfBE0L8YfIRWYjXJnvOU',
  'AIzaSyCIbR-y4i_Sl3vXqMDNcZXAw3IS_me2Qpk',
  'AIzaSyCd_TEqzNLsnfYc9X-UKAKcxuKZDCjcAF4',
  'AIzaSyAHC4Npm-RlisCekmDq4ptoP_Y4n3QeL8g',
  'AIzaSyDZK0xbUaSpBkCZNp1phGWmQrw-PdSKkZ4',
  'AIzaSyCLsr4WbFkJ7DiZF8QADyUjdv1ysoemXXE',
  'AIzaSyB3bbaMDqFk0NEsdlDI1DjgOXTUZXJ-uA0',
  'AIzaSyBe-9I4aT4pznGOVMPp3k60zpsSgyK5SWM',
  'AIzaSyDlDTETOn-hxIPFyqpwpdgfelVVhSJVyZA',
];

let currentKeyIndex = 0;
function getNextKey(): string {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

const DOCUMENT_CONTENT = `
DOCUMENT 1: SCHOOL SOCIAL WORK

School social work is a specialized area of practice within the broad field of the social work profession.
School social workers bring unique knowledge and skills to the school system and the student services team.
School Social Workers are trained mental health professionals who can assist with mental health concerns, behavioral concerns, positive behavioral support, academic and classroom support, consultation with teachers, parents and administrators as well as provide individual and group counseling/therapy.
School social workers are instrumental in furthering the mission of the schools which is to provide a setting for teaching, learning, and for the attainment of competence and confidence.
School social workers are hired by school districts to enhance the district's ability to meet its academic mission, especially where home, school and community collaboration is the key to achieving student success.

School Social Workers are trained mental health professionals with a degree in social work who provide services related to a person's social, emotional and life adjustment to school and/or society. School Social Workers are the link between the home, school and community in providing direct as well as indirect services to students, families and school personnel to promote and support students' academic and social success.

Children today are increasingly victims of many social forces that negatively affect their role as students. The family is in a state of change and until it becomes stabilized, in whatever form, children's unmet physical and emotional needs will continue to interfere with their ability to learn and adjust in school.

A school social worker identifies students that may be having problems including academic problems, social problems, behavioral problems, and problems at home.

Academic Problems: Failing grades, Low test scores, Attendance problems resulting in incomplete work, Learning problems
Social Problems: Being a victim of bullying, Not being able to make friends, Not "fitting in", Peer pressure
Behavioral Problems: Dismissing school policies, Fighting, Substance abuse, Not getting along with teachers
Problems at Home: Abuse, Neglect, Substance Abuse, Poverty

A school social worker identifies problems, determines causes through observing, interviewing, or testing, creates plans for students, teachers, and families. Examples include: arranging special classes for learning disabilities, creating bullying prevention programs, counseling students with stress/anxiety/depression, and creating school policies.

SERVICES PROVIDED:
- Related Services: special education assessment, Educational Planning Meetings, counseling (group, individual, family), mobilizing resources
- Services to Students: crisis intervention, developing intervention strategies, conflict resolution, anger management, social interaction skills
- Services to Parents/Families: facilitating school adjustment support, alleviating family stress, accessing programs, using school and community resources
- Services to School Personnel: providing information about factors affecting student performance, assessing mental health concerns, developing training programs, behavior management, direct support
- School-Community Liaison: coordinating community resources, obtaining support from mental health agencies, advocating for new services
- Services to Districts: educational programs for exceptional children, alternative programs for drop-outs/truants, identifying and reporting child abuse and neglect, school law and policy consultation, case management

DOCUMENT 2: SCOPE OF SOCIAL WORK PRACTICE - DISABILITY

The Australian Association of Social Workers (AASW) discusses the role, scope and contribution of social work in the disability field.
The social work profession is committed to maximising the wellbeing of individuals, families, groups, communities and society.
Social workers consider that individual and societal wellbeing is underpinned by socially inclusive communities that emphasise principles of social justice and respect for human dignity and human rights.

The social work profession operates at the interface between people and their social, cultural, physical and natural environments. Through casework, assessments, counselling, family work, advocacy, research, policy and community work, social workers operate from a person-in-environment perspective.

Social workers make a distinction between impairment and disability. While impairment refers to the differences in capacity that can cause difficulty in everyday functioning, disability represents the larger and more complex interaction between an individual with impairment and the structures and processes of society.

Social workers adopt a person-in-environment approach that includes a focus on the structural and cultural factors that may negatively impact on an individual's ability to engage with the social world.

Role of social work in disability field includes:
- Maintaining and enhancing quality of life
- All levels of management and program design
- Individual planning, counselling, coordination and case management
- Policy development, research and advocacy
- National Disability Insurance Agency management roles
- Local area coordinators and planners
- Service coordinators

Practice areas include:
- Assessment: Strengths-based psychosocial assessment, Risk assessment, Capacity and functioning assessment
- Capacity building: Working with communities, mainstream services, families
- Case management and service coordination: Service brokerage, Multidisciplinary teams, Referrals, Housing assistance, Advanced care planning, Guardianship
- Advocacy: Self-advocacy support, Organisational and systemic advocacy
- Counselling and therapeutic approaches: Individual, family and group work, Grief and loss, Life transitions, Behaviour support plans
- Planning: Facilitating planning with resources and choices
- Mediation and conflict resolution
- Crisis interventions
- Policy and Program Design and research

Specialist expertise areas:
- Impact of disability
- Abuse, neglect and family violence
- Mental health including carer issues of chronic sorrow and depression
- Complex family dynamics and limited social supports
- Homelessness or inappropriate accommodation
- Trauma and crisis
- Transition points in people's lives
- Socio-legal issues and ethical decision making (advanced health directives, enduring power of attorneys, end-of-life decision making)
`;

export async function POST(request: Request) {
  try {
    const { questionCount = 30 } = await request.json();
    
    const prompt = `You are an English language test generator for Social Work specialized vocabulary. Based on the following documents about School Social Work and Social Work in Disability, generate exactly ${questionCount} questions for a 30-minute English test.

The test MUST include these question types in this distribution:
- Multiple Choice (vocabulary meaning): 8 questions - Choose the correct definition/meaning of a specialized term
- Fill in the Blank: 6 questions - Complete sentences with the correct specialized term
- True/False: 5 questions - Determine if statements about social work concepts are true or false
- Matching: 4 questions - Match terms with their definitions (each matching question has 4 pairs)
- Reading Comprehension: 4 questions - Read a passage and answer questions
- Word Formation: 3 questions - Form the correct word form to complete the sentence

DOCUMENTS:
${DOCUMENT_CONTENT}

IMPORTANT RULES:
1. All questions must test understanding of SPECIALIZED ENGLISH VOCABULARY from these documents
2. Questions should range from intermediate to advanced difficulty
3. Each question must have a clear, unambiguous correct answer
4. For multiple choice, provide 4 options (A, B, C, D)
5. For matching, provide 4 pairs of terms and definitions
6. For reading comprehension, provide a short passage (2-3 sentences) from the content then ask a question
7. Distractors should be plausible but clearly incorrect
8. Cover vocabulary from BOTH documents

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "What does the term 'psychosocial assessment' refer to in social work?",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "B",
      "explanation": "Brief explanation of the correct answer"
    },
    {
      "id": 2,
      "type": "fill_blank",
      "question": "School social workers provide _____ intervention when students face immediate crises.",
      "options": null,
      "correctAnswer": "crisis",
      "explanation": "Crisis intervention is a key service provided to students"
    },
    {
      "id": 3,
      "type": "true_false",
      "question": "Impairment and disability are interchangeable terms in social work practice.",
      "options": null,
      "correctAnswer": "False",
      "explanation": "Impairment refers to differences in capacity while disability represents the interaction between impairment and societal structures"
    },
    {
      "id": 4,
      "type": "matching",
      "question": "Match the following social work terms with their correct definitions:",
      "options": [
        {"term": "Advocacy", "definition": "Supporting individuals' rights and needs"},
        {"term": "Case management", "definition": "Coordinating services for clients"},
        {"term": "Counselling", "definition": "Therapeutic support for emotional issues"},
        {"term": "Mediation", "definition": "Resolving conflicts between parties"}
      ],
      "correctAnswer": "All pairs matched correctly",
      "explanation": "These are core social work practice areas"
    },
    {
      "id": 5,
      "type": "reading_comprehension",
      "question": "Read the passage: 'Social workers make a distinction between impairment and disability. While impairment refers to the differences in capacity that can cause difficulty in everyday functioning, disability represents the larger and more complex interaction between an individual with impairment and the structures and processes of society.' According to the passage, disability is primarily caused by:",
      "options": ["A. Physical limitations", "B. Medical conditions", "C. Societal structures failing to accommodate differences", "D. Cognitive impairments"],
      "correctAnswer": "C",
      "explanation": "The passage emphasizes that disability is about societal interaction, not just impairment"
    },
    {
      "id": 6,
      "type": "word_formation",
      "question": "The social worker provided _____ (COUNSEL) to the family dealing with grief and loss.",
      "options": null,
      "correctAnswer": "counselling",
      "explanation": "The noun form 'counselling' is needed here"
    }
  ]
}

Generate exactly ${questionCount} questions with the specified distribution. Make sure questions are challenging and test real understanding of social work English terminology.`;

    let retries = Math.min(API_KEYS.length, 5); // try up to 5 times
    let lastError = '';
    
    while (retries > 0) {
      try {
        const apiKey = getNextKey();
        console.log(`Using API Key starting with ${apiKey.substring(0, 10)}... (Retries left: ${retries - 1})`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Clean the response - remove markdown code blocks if present
        let cleanedText = responseText.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.slice(7);
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.slice(3);
        }
        if (cleanedText.endsWith('```')) {
          cleanedText = cleanedText.slice(0, -3);
        }
        cleanedText = cleanedText.trim();
        
        const parsed = JSON.parse(cleanedText);
        
        if (!parsed.questions || !Array.isArray(parsed.questions)) {
          throw new Error('Invalid response structure');
        }
        
        return NextResponse.json(parsed);
      } catch (err) {
        lastError = String(err);
        retries--;
        if (retries > 0) {
          console.warn(`Attempt failed. Retrying... Error: ${lastError.substring(0, 200)}`);
          // Wait briefly before trying with the next key
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    return NextResponse.json({ error: `Failed to generate questions after retries: ${lastError}` }, { status: 500 });

    
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json({ error: 'Failed to generate questions: ' + String(error) }, { status: 500 });
  }
}
