import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PetDetailPage from "./pages/PetDetailPage";
import PublishPetPage from "./pages/PublishPetPage";
import ProfilePage from "./pages/ProfilePage";
import KnowledgeListPage from "./pages/KnowledgeListPage";
import KnowledgeDetailPage from "./pages/KnowledgeDetailPage";
import CloudPetsPage from "./pages/CloudPetsPage";
import DonationsPage from "./pages/DonationsPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import ActivityDetailPage from "./pages/ActivityDetailPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pet/:id" element={<PetDetailPage />} />
        <Route path="/publish" element={<PublishPetPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/knowledge" element={<KnowledgeListPage />} />
        <Route path="/knowledge/:id" element={<KnowledgeDetailPage />} />
        <Route path="/cloud-pets" element={<CloudPetsPage />} />
        <Route path="/donations" element={<DonationsPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/activities/:id" element={<ActivityDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
