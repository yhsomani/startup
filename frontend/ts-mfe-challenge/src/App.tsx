// React imported for JSX transform if needed, but unused var check fails.
// Disable unused var for this line or remove.
import { Routes, Route } from 'react-router-dom';
import ChallengeList from './pages/ChallengeList';
import ChallengeDetails from './pages/ChallengeDetails';
import LeaderboardPage from './pages/LeaderboardPage';
import UserSubmissionsPage from './pages/UserSubmissionsPage';
import GradingPage from './pages/GradingPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChallengeList />} />
      <Route path="/submissions/user" element={<UserSubmissionsPage />} />
      <Route path="/:challengeId" element={<ChallengeDetails />} />
      <Route path="/:challengeId/leaderboard" element={<LeaderboardPage />} />
      <Route path="/:challengeId/submissions/:submissionId/grade" element={<GradingPage />} />
    </Routes>
  );
}

export default App;
