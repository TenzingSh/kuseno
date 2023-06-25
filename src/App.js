import React from "react";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Content from "./components/content";
import "./App.css";

const App = () => {
  return (
    <div className="main-container" style={{backgroundImage:'url("./assets/img/body-bg.png")'}}>
      <img className="mark-img" src={"./assets/img/mark.png"}/>
      <Header />
      <Content />
      <Footer />
    </div>
  );
};

export default App;
