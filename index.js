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

app.use(cors({ origin: 'http://localhost:3000' }));

app.get('/repos', async (req, res) => {
  console.log('request received: /repos');
  try {
    const response = await axios.get(
      `https://api.github.com/users/${GH_USER}/repos`,
      {
        headers: {
          Authorization: `Bearer ${GH_AUTH}`,
        },
      }
    );

    // const repositories = response.data.map((repo) => repo.name);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching repositories: ', error.message);
    res
      .status(500)
      .json({ error: 'An error occurred while fetching repositories.' });
  }
});

app.get('/issues', async (req, res) => {
  console.log('request received: /issues');
  try {
    const repoName = req.query.repo;

    if (!repoName) {
      return res.status(400).json({ error: 'Missing "repo" query param' });
    }

    console.log('requesting issues for repo: ', repoName);
    console.log('gh_user: ', GH_USER);
    const response = await axios.get(
      `https://api.github.com/repos/${GH_USER}/${repoName}/issues`,
      {
        headers: {
          Authorization: `Bearer ${GH_AUTH}`,
        },
      }
    );

    const issues = response.data;
    res.json(issues);
  } catch (error) {
    console.error('Error fetching repositories: ', error.message);
    res
      .status(500)
      .json({ error: 'An error occurred while fetching repositories.' });
  }
});

app.listen(port, () => {
  console.log('Server is listening on port: ', port);
});
