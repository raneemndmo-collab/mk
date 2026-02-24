import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("./pages/Home"));
const Search = lazy(() => import("./pages/Search"));
const UnitDetail = lazy(() => import("./pages/UnitDetail"));
const Login = lazy(() => import("./pages/Login"));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-cobnb-primary border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/unit/:id" element={<UnitDetail />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Suspense>
  );
}
