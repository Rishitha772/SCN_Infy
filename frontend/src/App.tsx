import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/Auth';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { UserRole } from './types';

// Page Imports
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { VerifyLogin } from './pages/auth/VerifyLogin';

// Researcher pages
import { Dashboard } from './pages/dashboard/Dashboard';
import { Profile } from './pages/researchers/Profile';
import { ProfileCreate } from './pages/researchers/ProfileCreate';
import { ResearcherDirectory } from './pages/researchers/ResearcherDirectory';

// Publication pages
import { Publications } from './pages/publications/Publications';
import { PublicationDetails } from './pages/publications/PublicationDetails';
import { PublicationForm } from './pages/publications/PublicationForm';

// Project pages
import { Projects } from './pages/projects/Projects';
import { ProjectDetails } from './pages/projects/ProjectDetails';
import { ProjectForm } from './pages/projects/ProjectForm';

// Other pages
import { Collaborations } from './pages/collaborations/Collaborations';
import { Conferences } from './pages/conferences/Conferences';
import { Citations } from './pages/citations/Citations';
import { Reports } from './pages/reports/Reports';
import { Settings } from './pages/settings/Settings';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { PendingUsers } from './pages/admin/PendingUsers';
import { Institutions } from './pages/admin/Institutions';
import { ConferencesAdmin } from './pages/admin/ConferencesAdmin';
import { RoleRequests } from './pages/admin/RoleRequests';

export const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/verify-login" element={<VerifyLogin />} />

            {/* General Protected Researcher Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Profile />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/create" 
              element={
                <ProtectedRoute>
                  <ProfileCreate />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/researchers" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ResearcherDirectory />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/researchers/:id" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Profile />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Publication Routes */}
            <Route 
              path="/publications" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Publications />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/publications/new" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PublicationForm />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/publications/:id" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PublicationDetails />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/publications/:id/edit" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PublicationForm />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Project Routes */}
            <Route 
              path="/projects" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Projects />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects/new" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProjectForm />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects/:id" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProjectDetails />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects/:id/edit" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProjectForm />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Collaborations, Conferences, Citations, Reports, Settings */}
            <Route 
              path="/collaborations" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Collaborations />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/conferences" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Conferences />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/citations" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Citations />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Reports />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* System Administrator Protected Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={[UserRole.SYSTEM_ADMIN]}>
                    <AppLayout>
                      <AdminDashboard />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={[UserRole.SYSTEM_ADMIN]}>
                    <AppLayout>
                      <UserManagement />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/pending-users" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={[UserRole.SYSTEM_ADMIN]}>
                    <AppLayout>
                      <PendingUsers />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/institutions" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={[UserRole.SYSTEM_ADMIN]}>
                    <AppLayout>
                      <Institutions />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/conferences" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={[UserRole.SYSTEM_ADMIN]}>
                    <AppLayout>
                      <ConferencesAdmin />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/role-requests" 
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={[UserRole.SYSTEM_ADMIN]}>
                    <AppLayout>
                      <RoleRequests />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } 
            />

            {/* Redirect fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
