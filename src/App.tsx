import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';

import { Dashboard } from './components/dashboard/Dashboard';

import { IncomeModule } from './components/income/IncomeModule';
import { ExpenseModule } from './components/expenses/ExpenseModule';
import { InvestmentModule } from './components/investments/InvestmentModule';
import { GoalModule } from './components/goals/GoalModule';
import { AdminModule } from './components/admin/AdminModule';
import { ScenarioModule } from './components/simulation/ScenarioModule';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-[240px]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ingresos" element={<IncomeModule />} />
            <Route path="/egresos" element={<ExpenseModule />} />
            <Route path="/inversiones" element={<InvestmentModule />} />
            <Route path="/objetivos" element={<GoalModule />} />
            <Route path="/simulador" element={<ScenarioModule />} />
            <Route path="/admin" element={<AdminModule />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
