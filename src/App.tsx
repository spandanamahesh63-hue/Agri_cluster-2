import { Suspense, type ReactElement } from "react";
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from "react-router-dom";
import type { Role } from "./types";
import { AppStoreProvider, useAppStore } from "./store/AppStore";
import { ToastProvider } from "./components/ui/Toast";
import { AppShell } from "./components/layout/AppShell";
import { RequireRole } from "./components/layout/RequireRole";
import { roleHome, roleList } from "./components/navigation/navConfig";
import { lazyPage } from "./utils/lazyPage";
import { DemoGuideProvider } from "./features/demo/DemoGuide";
import { AccountProvider } from "./features/accounts/AccountProvider";
import { SensorScreen } from "./features/farmer/NoSensorData";
import { accountsEnabled } from "./services/auth/accounts";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { ContactPage, PricingPage, PrivacyPage, RefundsPage, TermsPage } from "./pages/public/PublicPages";
const FeedbackPage = lazyPage(() => import("./pages/public/FeedbackPage"), "FeedbackPage");
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
const SupportPage = lazyPage(() => import("./pages/farmer/SupportPage"), "SupportPage");
const ClusterRevenuePage = lazyPage(() => import("./pages/cluster/ClusterRevenuePage"), "ClusterRevenuePage");
const ClusterSupportPage = lazyPage(() => import("./pages/cluster/ClusterSupportPage"), "ClusterSupportPage");
const ProfilePage = lazyPage(() => import("./pages/farmer/ProfilePage"), "ProfilePage");
const PlanOverviewPage = lazyPage(() => import("./pages/farmer/plan/PlanOverviewPage"), "PlanOverviewPage");
const AssessmentStep = lazyPage(() => import("./pages/farmer/plan/AssessmentStep"), "AssessmentStep");
const VisionStep = lazyPage(() => import("./pages/farmer/plan/VisionStep"), "VisionStep");
const CropStep = lazyPage(() => import("./pages/farmer/plan/CropStep"), "CropStep");
const MethodStep = lazyPage(() => import("./pages/farmer/plan/MethodStep"), "MethodStep");
const InvestmentStep = lazyPage(() => import("./pages/farmer/plan/InvestmentStep"), "InvestmentStep");
const MarketStep = lazyPage(() => import("./pages/farmer/plan/MarketStep"), "MarketStep");
const ScheduleStep = lazyPage(() => import("./pages/farmer/plan/ScheduleStep"), "ScheduleStep");
const ResourcesStep = lazyPage(() => import("./pages/farmer/plan/ResourcesStep"), "ResourcesStep");
const WaterPage = lazyPage(() => import("./pages/farmer/WaterPage"), "WaterPage");
const EnergyPage = lazyPage(() => import("./pages/farmer/EnergyPage"), "EnergyPage");
const ClusterHome = lazyPage(() => import("./pages/cluster/ClusterHome"), "ClusterHome");
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
const ServicesPage = lazyPage(() => import("./pages/provider/ServicesPage"), "ServicesPage");
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
const CommunityDashboard = lazyPage(() => import("./pages/community/CommunityDashboard"), "CommunityDashboard");
const GroupsPage = lazyPage(() => import("./pages/community/GroupsPage"), "GroupsPage");
const EventsPage = lazyPage(() => import("./pages/community/EventsPage"), "EventsPage");
const CommunityPage = lazyPage(() => import("./pages/shared/CommunityPage"), "CommunityPage");
const WelcomePage = lazyPage(() => import("./pages/account/WelcomePage"), "WelcomePage");
const AccountStatusPage = lazyPage(() => import("./pages/account/AccountStatusPage"), "AccountStatusPage");
const PeoplePage = lazyPage(() => import("./pages/account/PeoplePage"), "PeoplePage");
const RoleProfilePage = lazyPage(() => import("./pages/shared/RoleProfilePage"), "RoleProfilePage");

// Screens that are built. Any nav item not listed here renders <PlannedPage>.
const implemented: Partial<Record<Role, Record<string, ReactElement>>> = {
  farmer: {
    "": <FarmerDashboard />,
    plan: <PlanOverviewPage />,
    farm: <MyFarmPage />,
    intelligence: <SensorScreen title="Intelligence" what="Suggestions here come from soil moisture, crop health and weather readings for your fields."><IntelligencePage /></SensorScreen>,
    crops: <SensorScreen title="Crops" what="Crop progress here is tracked from field sensors and crop health readings."><CropsPage /></SensorScreen>,
    market: <MarketPage />,
    resources: <ResourcesPage />,
    experts: <ExpertsPage />,
    support: <SupportPage />,
    profile: <ProfilePage />,
  },
  cluster: {
    "": <ClusterHome />,
    farms: <SensorScreen title="Farms" what="The farm map and roster are built from member farms' sensor and crop data." cluster><ClusterFarmsPage /></SensorScreen>,
    intelligence: <SensorScreen title="Intelligence" what="Cluster-wide suggestions combine every member farm's field readings." cluster><ClusterIntelligencePage /></SensorScreen>,
    water: <SensorScreen title="Water" what="Water use across the cluster comes from member farms' sensors and pump meters." cluster><ClusterWaterPage /></SensorScreen>,
    energy: <SensorScreen title="Energy" what="Energy use across the cluster comes from member farms' pump meters." cluster><ClusterEnergyPage /></SensorScreen>,
    crops: <SensorScreen title="Crops" what="The cluster's crop calendar is built from member farms' crop data." cluster><ClusterCropsPage /></SensorScreen>,
    resources: <SensorScreen title="Resources" what="Machinery and labour demand across the cluster is built from member farms' plans." cluster><ClusterResourcesPage /></SensorScreen>,
    market: <SensorScreen title="Market" what="Expected supply across the cluster is built from member farms' crop data." cluster><ClusterMarketPage /></SensorScreen>,
    support: <ClusterSupportPage />,
    revenue: <ClusterRevenuePage />,
    impact: <SensorScreen title="Impact" what="Impact figures compare member farms' measured water, energy and income." cluster><ClusterImpactPage /></SensorScreen>,
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
    services: <ServicesPage />,
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
  community: {
    "": <CommunityDashboard />,
    groups: <GroupsPage />,
    events: <EventsPage />,
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
    // The old onboarding is now the planning journey's first step.
    { path: "onboarding", element: <Navigate to="/farmer/plan/assessment" replace /> },
    { path: "plan/assessment", element: <AssessmentStep /> },
    { path: "plan/vision", element: <VisionStep /> },
    { path: "plan/crop", element: <CropStep /> },
    { path: "plan/method", element: <MethodStep /> },
    { path: "plan/investment", element: <InvestmentStep /> },
    { path: "plan/market", element: <MarketStep /> },
    { path: "plan/schedule", element: <ScheduleStep /> },
    { path: "plan/resources", element: <ResourcesStep /> },
    { path: "intelligence/water", element: <WaterPage /> },
    { path: "intelligence/energy", element: <EnergyPage /> },
    { path: "intelligence/:id", element: <SensorScreen title="Suggestion" what="Suggestions come from your fields' sensor readings."><RecommendationDetailPage /></SensorScreen> },
    { path: "market/upload", element: <UploadCropPage /> },
  ],
  // Admins approve people here (real accounts only).
  cluster: [{ path: "people", element: <PeoplePage /> }],
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
          <AccountProvider>
          <DemoGuideProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={accountsEnabled ? <Navigate to="/login" replace /> : <SignupPage />} />
            <Route path="/welcome" element={<Suspense fallback={<div className="min-h-dvh bg-canvas" aria-busy="true" />}><WelcomePage /></Suspense>} />
            <Route path="/account/status" element={<Suspense fallback={<div className="min-h-dvh bg-canvas" aria-busy="true" />}><AccountStatusPage /></Suspense>} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/refunds" element={<RefundsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route
              path="/feedback"
              element={
                <Suspense fallback={<div className="min-h-dvh bg-canvas" aria-busy="true" />}>
                  <FeedbackPage />
                </Suspense>
              }
            />

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
                  const element = implemented[role]?.[item.path] ?? sharedScreen(role, item.path) ?? <PlannedPage item={item} />;
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
          </AccountProvider>
        </Router>
      </ToastProvider>
    </AppStoreProvider>
  );
}
