import Card from "../components/ui/Card";
import PomodoroMini from "../components/ui/PomodoroMini";

export default function Dashboard() {
  return (
    <div className="grid gap-5">
      <p className="text-[var(--muted-text)]">
        **Widgets are placeholders for later sprints.
      </p>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4">
          <Card title="Weekly Tasks Completed">
            <p className="text-[var(--muted-text)]">
              Placeholder: donut chart of % tasks completed this week vs. total
              assigned.
            </p>
          </Card>
        </div>
        {/* TODO: finish Pomodoro Widget */}
        <div className="col-span-12 lg:col-span-4">
          <PomodoroMini />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <Card title="Burnout Risk">
            <p className="text-[var(--muted-text)]">
              Placeholder: Low - High burnout risk
            </p>
          </Card>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <Card title="Workload vs Capacity">
            <p className="text-[var(--muted-text)]">
              Placeholder: Donut chart showing workload vs capacity.
            </p>
          </Card>
        </div>
        <div className="col-span-12">
          <Card title="Heatmap Danger Zones">
            <p className="text-[var(--muted-text)]">
              Placeholder: next 7 days heatmap highlight
            </p>
          </Card>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <Card title="Burnout Contributors">
            <p className="text-[var(--muted-text)]">
              Placeholder: Top Burnout contributors with low - high contribution
              factor chart
            </p>
          </Card>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <Card title="Suggested Actions">
            <p className="text-[var(--muted-text)]">
              Placeholder: Quick action buttons for suggested burnout reduction
              strategies.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
