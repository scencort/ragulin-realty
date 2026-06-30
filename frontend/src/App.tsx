import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { PageLoader } from "@/components/ui/Loader";
import { isAuthenticated } from "@/utils/auth";

const Home = lazy(() => import("@/pages/Home"));
const Catalog = lazy(() => import("@/pages/Catalog"));
const PropertyDetail = lazy(() => import("@/pages/PropertyDetail"));
const About = lazy(() => import("@/pages/About"));
const ReviewsPage = lazy(() => import("@/pages/ReviewsPage"));
const Contacts = lazy(() => import("@/pages/Contacts"));
const AdminLogin = lazy(() => import("@/pages/admin/Login"));
const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const PropertiesAdmin = lazy(() => import("@/pages/admin/PropertiesAdmin"));
const PropertyFormPage = lazy(() => import("@/pages/admin/PropertyFormPage"));
const ReviewsAdmin = lazy(() => import("@/pages/admin/ReviewsAdmin"));
const SEOAdmin = lazy(() => import("@/pages/admin/SEOAdmin"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><PageLoader /></div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/property/:slug" element={<PropertyDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/contacts" element={<Contacts />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/properties" element={<ProtectedRoute><PropertiesAdmin /></ProtectedRoute>} />
        <Route path="/admin/properties/:id" element={<ProtectedRoute><PropertyFormPage /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute><ReviewsAdmin /></ProtectedRoute>} />
        <Route path="/admin/seo" element={<ProtectedRoute><SEOAdmin /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
