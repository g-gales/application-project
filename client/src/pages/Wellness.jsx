import api from "../api/axiosConfig";
import Card from "../components/ui/Card";

export default function Wellness() {
  return (
    <div className="stack gap-md">
      <Card title="Wellness Overview" />
      <Card title="Daily Check-In" />
      <Card title="Wellness Trends" />
      <Card title="Insights & Actions" />
    </div>
  );
}
