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
  'https://railway-gh-issue-tracker.vercel.app/',
];
app.use(cors({ origin: allowedOrigins })); // TODO make this depend on prod vs dev?

app.get('/repos', async (req, res) => {
  console.log('request received: /repos', new Date());
  try {
    const response = await axios.get(
      // `https://api.github.com/users/${GH_USER}/repos`,
      `https://api.github.com/user/repos`,
      {
        headers: {
          Authorization: `Bearer ${GH_AUTH}`,
        },
      }
    );

    res.json(
      response.data.map((repo) => ({
        name: repo.name,
        url: repo.url,
      }))
    );
  } catch (error) {
    console.error('Error fetching repositories: ', error.message);
    res
      .status(500)
      .json({ error: 'An error occurred while fetching repositories.' });
  }
});

app.get('/issues', async (req, res) => {
  console.log('request received: /issues', new Date());
  try {
    const repoName = req.query.repo;

    if (!repoName) {
      return res.status(400).json({ error: 'Missing "repo" query param' });
    }

    console.log('requesting issues for repo: ', repoName, new Date());
    const response = await axios.get(
      `https://api.github.com/repos/${GH_USER}/${repoName}/issues?state=all`,
      {
        headers: {
          Authorization: `Bearer ${GH_AUTH}`,
        },
      }
    );

    res.json(
      response.data.map((issue) => ({
        labels: issue.labels,
        title: issue.title,
        url: issue.html_url,
        state: issue.state,
        body: issue.body,
      }))
    );
  } catch (error) {
    console.error('Error fetching repositories: ', error.message);
    res
      .status(500)
      .json({ error: 'An error occurred while fetching repositories.' });
  }
});

app.listen(port, () => {
  console.log('Server is listening on port: ', port, new Date());
});
