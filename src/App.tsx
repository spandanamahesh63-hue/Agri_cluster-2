import type { ReactElement } from "react";
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from "react-router-dom";
import type { Role } from "./types";
import { AppStoreProvider, useAppStore } from "./store/AppStore";
import { ToastProvider } from "./components/ui/Toast";
import { AppShell } from "./components/layout/AppShell";
import { RequireRole } from "./components/layout/RequireRole";
import { roleHome, roleList } from "./components/navigation/navConfig";
import { lazyPage } from "./utils/lazyPage";
import { DemoGuideProvider } from "./features/demo/DemoGuide";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { PlannedPage } from "./pages/shared/PlannedPage";
import { NotFoundPage } from "./pages/shared/NotFoundPage";
const FarmerDashboard = lazyPage(() => import("./pages/farmer/FarmerDashboard"), "FarmerDashboard");
const IntelligencePage = lazyPage(() => import("./pages/farmer/IntelligencePage"), "IntelligencePage");
const RecommendationDetailPage = lazyPage(() => import("./pages/farmer/RecommendationDetailPage"), "RecommendationDetailPage");
const MyFarmPage = lazyPage(() => import("./pages/farmer/MyFarmPage"), "MyFarmPage");
const CropsPage = lazyPage(() => import("./pages/farmer/CropsPage"), "CropsPage");
const MarketPage = lazyPage(() => import("./pages/farmer/MarketPage"), "MarketPage");
const UploadCropPage = lazyPage(() => import("./pages/farmer/UploadCropPage"), "UploadCropPage");
const ResourcesPage = lazyPage(() => import("./pages/farmer/ResourcesPage"), "ResourcesPage");
const ExpertsPage = lazyPage(() => import("./pages/farmer/ExpertsPage"), "ExpertsPage");
const ProfilePage = lazyPage(() => import("./pages/farmer/ProfilePage"), "ProfilePage");
const OnboardingPage = lazyPage(() => import("./pages/farmer/OnboardingPage"), "OnboardingPage");
const WaterPage = lazyPage(() => import("./pages/farmer/WaterPage"), "WaterPage");
const EnergyPage = lazyPage(() => import("./pages/farmer/EnergyPage"), "EnergyPage");
const ClusterOverviewPage = lazyPage(() => import("./pages/cluster/ClusterOverviewPage"), "ClusterOverviewPage");
const ClusterFarmsPage = lazyPage(() => import("./pages/cluster/ClusterFarmsPage"), "ClusterFarmsPage");
const ClusterIntelligencePage = lazyPage(() => import("./pages/cluster/ClusterIntelligencePage"), "ClusterIntelligencePage");
const ClusterWaterPage = lazyPage(() => import("./pages/cluster/ClusterWaterPage"), "ClusterWaterPage");
const ClusterEnergyPage = lazyPage(() => import("./pages/cluster/ClusterEnergyPage"), "ClusterEnergyPage");
const ClusterCropsPage = lazyPage(() => import("./pages/cluster/ClusterCropsPage"), "ClusterCropsPage");
const ClusterResourcesPage = lazyPage(() => import("./pages/cluster/ClusterResourcesPage"), "ClusterResourcesPage");
const ClusterMarketPage = lazyPage(() => import("./pages/cluster/ClusterMarketPage"), "ClusterMarketPage");
const ClusterImpactPage = lazyPage(() => import("./pages/cluster/ClusterImpactPage"), "ClusterImpactPage");
const BuyerDashboard = lazyPage(() => import("./pages/buyer/BuyerDashboard"), "BuyerDashboard");
const BuyerRequirementsPage = lazyPage(() => import("./pages/buyer/BuyerRequirementsPage"), "BuyerRequirementsPage");
const NewRequirementPage = lazyPage(() => import("./pages/buyer/NewRequirementPage"), "NewRequirementPage");
const RequirementDetailPage = lazyPage(() => import("./pages/buyer/RequirementDetailPage"), "RequirementDetailPage");
const CropSupplyPage = lazyPage(() => import("./pages/buyer/CropSupplyPage"), "CropSupplyPage");
const BuyerRequestsPage = lazyPage(() => import("./pages/buyer/BuyerRequestsPage"), "BuyerRequestsPage");
const DealsPage = lazyPage(() => import("./pages/buyer/DealsPage"), "DealsPage");
const ProviderDashboard = lazyPage(() => import("./pages/provider/ProviderDashboard"), "ProviderDashboard");
const EquipmentPage = lazyPage(() => import("./pages/provider/EquipmentPage"), "EquipmentPage");
const BookingsPage = lazyPage(() => import("./pages/provider/BookingsPage"), "BookingsPage");
const LabourDashboard = lazyPage(() => import("./pages/labour/LabourDashboard"), "LabourDashboard");
const WorkRequestsPage = lazyPage(() => import("./pages/labour/WorkRequestsPage"), "WorkRequestsPage");
const AssignmentsPage = lazyPage(() => import("./pages/labour/AssignmentsPage"), "AssignmentsPage");
const LabourProfilePage = lazyPage(() => import("./pages/labour/LabourProfilePage"), "LabourProfilePage");
const ExpertDashboard = lazyPage(() => import("./pages/expert/ExpertDashboard"), "ExpertDashboard");
const ExpertRequestsPage = lazyPage(() => import("./pages/expert/ExpertRequestsPage"), "ExpertRequestsPage");
const ConsultationsPage = lazyPage(() => import("./pages/expert/ConsultationsPage"), "ConsultationsPage");
const QueryDetailPage = lazyPage(() => import("./pages/expert/QueryDetailPage"), "QueryDetailPage");
const CommunityPage = lazyPage(() => import("./pages/shared/CommunityPage"), "CommunityPage");
const RoleProfilePage = lazyPage(() => import("./pages/shared/RoleProfilePage"), "RoleProfilePage");

// Screens that are built. Any nav item not listed here renders <PlannedPage>.
const implemented: Partial<Record<Role, Record<string, ReactElement>>> = {
  farmer: {
    "": <FarmerDashboard />,
    farm: <MyFarmPage />,
    intelligence: <IntelligencePage />,
    crops: <CropsPage />,
    market: <MarketPage />,
    resources: <ResourcesPage />,
    experts: <ExpertsPage />,
    profile: <ProfilePage />,
  },
  cluster: {
    "": <ClusterOverviewPage />,
    farms: <ClusterFarmsPage />,
    intelligence: <ClusterIntelligencePage />,
    water: <ClusterWaterPage />,
    energy: <ClusterEnergyPage />,
    crops: <ClusterCropsPage />,
    resources: <ClusterResourcesPage />,
    market: <ClusterMarketPage />,
    impact: <ClusterImpactPage />,
  },
  buyer: {
    "": <BuyerDashboard />,
    requirements: <BuyerRequirementsPage />,
    supply: <CropSupplyPage />,
    requests: <BuyerRequestsPage />,
    deals: <DealsPage />,
  },
  provider: {
    "": <ProviderDashboard />,
    equipment: <EquipmentPage />,
    bookings: <BookingsPage />,
  },
  labour: {
    "": <LabourDashboard />,
    jobs: <WorkRequestsPage />,
    assignments: <AssignmentsPage />,
    profile: <LabourProfilePage />,
  },
  expert: {
    "": <ExpertDashboard />,
    requests: <ExpertRequestsPage />,
    consultations: <ConsultationsPage />,
  },
};

/** Shared screens used by every role that lists them in its navigation. */
function sharedScreen(role: Role, path: string): ReactElement | undefined {
  if (path === "community") return <CommunityPage />;
  if (path === "profile") return <RoleProfilePage role={role} />;
  return undefined;
}

// Routes reachable from inside a role's screens but not listed in its navigation.
const extraRoutes: Partial<Record<Role, { path: string; element: ReactElement }[]>> = {
  farmer: [
    { path: "onboarding", element: <OnboardingPage /> },
    { path: "intelligence/water", element: <WaterPage /> },
    { path: "intelligence/energy", element: <EnergyPage /> },
    { path: "intelligence/:id", element: <RecommendationDetailPage /> },
    { path: "market/upload", element: <UploadCropPage /> },
  ],
  buyer: [
    { path: "requirements/new", element: <NewRequirementPage /> },
    { path: "requirements/:id", element: <RequirementDetailPage /> },
  ],
  expert: [{ path: "requests/:id", element: <QueryDetailPage /> }],
};

// The single-file build (for judges: double-click to open, or publish as one page)
// cannot serve deep URLs, so it routes with the URL hash instead.
const Router = import.meta.env.MODE === "single" ? HashRouter : BrowserRouter;

function Home() {
  const { session } = useAppStore();
  return <Navigate to={session ? roleHome(session.role) : "/login"} replace />;
}

export default function App() {
  return (
    <AppStoreProvider>
      <ToastProvider>
        <Router>
          <DemoGuideProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {roleList.map(({ role, nav }) => (
              <Route
                key={role}
                path={`/${role}`}
                element={
                  <RequireRole role={role}>
                    <AppShell role={role} />
                  </RequireRole>
                }
              >
                {nav.map((item) => {
                  const element = implemented[role]?.[item.path] ?? sharedScreen(role, item.path) ?? <PlannedPage role={role} item={item} />;
                  return item.path === "" ? (
                    <Route key="index" index element={element} />
                  ) : (
                    <Route key={item.path} path={item.path} element={element} />
                  );
                })}
                {extraRoutes[role]?.map((r) => <Route key={r.path} path={r.path} element={r.element} />)}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            ))}

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </DemoGuideProvider>
        </Router>
      </ToastProvider>
    </AppStoreProvider>
  );
}
