import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { Layout } from "./components/Layout";

import Index from "./pages/Index";
import TribesPage from "./pages/TribesPage";
import TribePage from "./pages/TribePage";
import EventPage from "./pages/EventPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import ChatPage from "./pages/ChatPage";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tribes" element={<TribesPage />} />
          <Route path="/tribe/:tribeId" element={<TribePage />} />
          <Route path="/event/:eventId" element={<EventPage />} />
          <Route path="/profile/:pubkey" element={<ProfilePage />} />
          <Route path="/settings/profile" element={<ProfileSettingsPage />} />
          <Route path="/messages" element={<ChatPage />} />
          {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
          <Route path="/:nip19" element={<NIP19Page />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
export default AppRouter;