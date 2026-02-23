import { NavLink } from "react-router-dom";

function TestComponent() {
  return (
    <div>
      <h1>This is a test</h1>
      <p>if you can see this, it means you are successfully authenticated</p>
      <NavLink to="/dashboard">Go back to dashboard</NavLink>
    </div>
  );
}

export default TestComponent;
