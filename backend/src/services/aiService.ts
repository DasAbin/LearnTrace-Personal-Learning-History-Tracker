import Groq from 'groq-sdk';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import * as analyticsService from './analyticsService';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export const generateBullets = async (userId: string, entryId: string) => {
  const entry = await prisma.learningEntry.findFirst({
    where: { id: entryId, userId }
  });

  if (!entry) throw new Error('Entry not found');

  const prompt = `Convert the following learning description and reflection into 3-4 professional, action-oriented resume bullet points.
Title: ${entry.title}
Platform: ${entry.platform}
Skills: ${entry.skills.join(', ')}
Description: ${entry.description || 'N/A'}
Reflection: ${entry.reflection || 'N/A'}

Format the output strictly as a JSON array of strings. Do not include markdown formatting or additional text. Example: ["Bullet 1", "Bullet 2"]`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama3-8b-8192',
    response_format: { type: 'json_object' }
  });

  const content = completion.choices[0]?.message?.content || '{}';
  try {
     const parsed = JSON.parse(content);
     // Since response_format json_object requires an object, llama3 might return { "bullets": [...] }
     return Array.isArray(parsed) ? parsed : (parsed.bullets || Object.values(parsed)[0] || []);
  } catch (e) {
     return [content];
  }
};

export const extractUrl = async (url: string) => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const text = html.replace(/<[^>]*>?/gm, ' ').substring(0, 3000);

    const prompt = `Extract learning metadata from the following webpage content. Ensure valid JSON output.
URL: ${url}
Content: ${text}

Return a JSON object exactly like this:
{
  "title": "Course/Article Title",
  "platform": "Platform Name (e.g. Coursera, Medium, YouTube)",
  "domain": "Broad domain (e.g. Web Development, Data Science)",
  "description": "Short summary",
  "skills": ["Skill1", "Skill2"]
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
  } catch (error) {
    logger.error({ url, error }, 'Extraction failed');
    throw new Error('Failed to extract data from URL');
  }
};

export const analyzeSkillGap = async (userId: string, jobDescription: string) => {
  const userSkills = await analyticsService.getSkillsFrequency(userId);
  const userSkillSet = Object.keys(userSkills);

  const prompt = `Analyze the skill gap between the user's current skills and the given job description.
User Skills: ${userSkillSet.join(', ')}
Job Description: ${jobDescription}

Return a valid JSON object exactly like this:
{
  "matchingSkills": ["Skill1", "Skill2"],
  "missingSkills": ["Skill3", "Skill4"],
  "recommendation": "Brief advice on what to learn next."
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama3-8b-8192',
    response_format: { type: 'json_object' }
  });

  const content = completion.choices[0]?.message?.content || '{}';
  try {
    return JSON.parse(content);
  } catch (e) {
    return { matchingSkills: [], missingSkills: [], recommendation: "Analysis failed." };
  }
};
