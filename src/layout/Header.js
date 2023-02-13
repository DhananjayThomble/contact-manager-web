import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <Navbar bg="dark" expand="lg">
      <Container>
        <Navbar.Brand tag={Link} to={"/"} className={"text-white"}>
          Contact Manager Web
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
};

export default Header;
