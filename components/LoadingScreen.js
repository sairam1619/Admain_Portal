function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="loading-screen">
      <div className="loader"></div>

      <h2>{message}</h2>
    </div>
  );
}
