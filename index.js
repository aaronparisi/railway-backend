import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

const requiredEnvVars = ['GH_USER', 'GH_AUTH'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error('Missing env var: ', envVar);
    process.exit(1);
  }
}

const GH_USER = process.env.GH_USER;
const GH_AUTH = process.env.GH_AUTH;
console.log('gh_user: ', GH_USER, new Date());

const allowedOrigins = [
  'http://localhost:3000',
  'https://railway-gh-issue-tracker.vercel.app',
  'https://gh-issue-tracker.aaronparisi.dev',
  'https://www.gh-issue-tracker.aaronparisi.dev',
];
app.use(cors({ origin: allowedOrigins })); // TODO make this depend on prod vs dev?

let repoCache = {};

const getRepoData = async () => {
  try {
    // fetch repos
    console.log('fetching repos for user: ', GH_USER, new Date());
    const repoRes = await axios.get(`https://api.github.com/user/repos`, {
      headers: {
        Authorization: `Bearer ${GH_AUTH}`,
      },
    });

    repoRes.data.forEach((repo) => {
      repoCache[repo.name] = {
        name: repo.name,
        url: repo.html_url,
        issues: [],
      };
    });

    // fetch issues
    for (const repo of repoRes.data) {
      console.log('about to get issues for repo: ', repo.name, new Date());
      const issueRes = await axios.get(
        `https://api.github.com/repos/${GH_USER}/${repo.name}/issues?state=all`,
        {
          headers: {
            Authorization: `Bearer ${GH_AUTH}`,
          },
        }
      );
      console.log('done getting issues for repo: ', repo.name, new Date());

      repoCache[repo.name].issues = issueRes.data.map((issue) => ({
        labels: issue.labels,
        title: issue.title,
        url: issue.html_url,
        state: issue.state,
        body: issue.body,
      }));
    }
  } catch (error) {
    console.error('Error fetching git data: ', error.message);
    throw new Error(error.message);
  }
};

app.get('/all-data', async (req, res) => {
  console.log('request received: /all-data', new Date());
  res.json(repoCache);
});

const start = async () => {
  try {
    await getRepoData();

    app.listen(port, () => {
      console.log('Server is listening on port: ', port, new Date());
    });
  } catch (error) {
    console.error('Error initializing server', error.message);
  }
};

start();
