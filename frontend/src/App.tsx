import { Routes, Route, Navigate } from "react-router-dom";
import AdminPetsPage from "./pages/AdminPetsPage";
import PetEditorPage from "./pages/PetEditorPage";
import Layout from "./components/Layout";
import AdminPage from "./pages/AdminPage";
import AdminKnowledgePage from "./pages/AdminKnowledgePage";
import AdminActivitiesPage from "./pages/AdminActivitiesPage";
import KnowledgeEditorPage from "./pages/KnowledgeEditorPage";
import ActivityEditorPage from "./pages/ActivityEditorPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PetDetailPage from "./pages/PetDetailPage";
import ProfilePage from "./pages/ProfilePage";
import KnowledgeListPage from "./pages/KnowledgeListPage";
import KnowledgeDetailPage from "./pages/KnowledgeDetailPage";
import CloudPetsPage from "./pages/CloudPetsPage";
import DonationsPage from "./pages/DonationsPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import ActivityDetailPage from "./pages/ActivityDetailPage";
import AdoptPage from "./pages/AdoptPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import AdminAdoptionsPage from "./pages/AdminAdoptionsPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pet/:id" element={<PetDetailPage />} />
        <Route path="/pet/:id/adopt" element={<AdoptPage />} />
        <Route path="/my-applications" element={<MyApplicationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/knowledge" element={<KnowledgeListPage />} />
        <Route path="/knowledge/:id" element={<KnowledgeDetailPage />} />
        <Route path="/cloud-pets" element={<CloudPetsPage />} />
        <Route path="/donations" element={<DonationsPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/activities/:id" element={<ActivityDetailPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/knowledge" element={<AdminKnowledgePage />} />
        <Route path="/admin/knowledge/new" element={<KnowledgeEditorPage />} />
        <Route path="/admin/knowledge/:id/edit" element={<KnowledgeEditorPage />} />
        <Route path="/admin/activities" element={<AdminActivitiesPage />} />
        <Route path="/admin/activities/new" element={<ActivityEditorPage />} />
        <Route path="/admin/activities/:id/edit" element={<ActivityEditorPage />} />
        <Route path="/admin/pets" element={<AdminPetsPage />} />
        <Route path="/admin/pets/new" element={<PetEditorPage />} />
        <Route path="/admin/pets/:id/edit" element={<PetEditorPage />} />
        <Route path="/admin/adoptions" element={<AdminAdoptionsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
