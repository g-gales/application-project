import Card from "../ui/Card";

const PomodoroMini = ({ courses = [] }) => {
  return (
    <Card title="Study time completed this week:">
      <h1>
        This will include a progress bar for each class and times from completed
        pomodoros.
      </h1>
      <span>{courses.join(", ")}</span>
      {/* {courses.map((course) => {
        <span>{course.name}</span>;
        <span>{course.effort}</span>;
      })} */}
    </Card>
  );
};

export default PomodoroMini;
