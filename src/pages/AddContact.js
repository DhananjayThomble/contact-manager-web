import React, { useState, useContext, useEffect } from "react";

// firebase: app, storage, realtime db
import { initializeApp } from "firebase/app";
//firebase storage
import {
  getStorage,
  uploadBytesResumable,
  getDownloadURL,
  ref,
} from "firebase/storage";
//firebase realtime db
import { getDatabase, ref as dbRef, set } from "firebase/database";

// bootstrap
import {
  Container,
  Form,
  FormGroup,
  Button,
  Spinner,
  Row,
  Col,
} from "react-bootstrap";

// to compress image before uploading to the server
import { readAndCompressImage } from "browser-image-resizer";

// configs for image resizing and firebase
import { firebaseConfig, imageConfig } from "../utils/config";

import { MdAddCircleOutline } from "react-icons/md";
import { v4 } from "uuid";

// context stuffs
import { ContactContext } from "../context/Context";
import { CONTACT_TO_UPDATE } from "../context/Action_types";

import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AddContact = () => {
  // destructuring state and dispatch from context state
  const { state, dispatch } = useContext(ContactContext);
  const { contactToUpdate, contactToUpdateKey } = state;

  // react-router-dom hook
  const navigate = useNavigate();

  // simple state of all component
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [star, setStar] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  // const storage = getStorage();

  // when there is the contact to update in the Context state, then setting state with the value of the contact
  // will change only when the contact to update changes
  useEffect(() => {
    if (contactToUpdate) {
      setName(contactToUpdate.name);
      setEmail(contactToUpdate.email);
      setPhoneNumber(contactToUpdate.phoneNumber);
      setAddress(contactToUpdate.address);
      setStar(contactToUpdate.star);
      setDownloadUrl(contactToUpdate.picture);

      // also setting is update to true to make the update action instead the addContact action
      setIsUpdate(true);
    }
  }, [contactToUpdate]);

  // To upload image to firebase and then set the image link in the state of the app
  const imagePicker = async (e) => {
    try {
      const file = e.target.files[0];

      const metadata = {
        contentType: file.type,
      };

      let resizedImage = await readAndCompressImage(file, imageConfig);

      const storage = getStorage(app);
      const storageRef = await ref(storage, "images/" + file.name);
      const uploadTask = uploadBytesResumable(
        storageRef,
        resizedImage,
        metadata
      );

      // Listen for state changes, errors, and completion of the upload.
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          setIsUploading(true);
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          // console.log("Upload is " + progress + "% done");
          switch (snapshot.state) {
            case "paused":
              setIsUploading(false);
              // console.log("Upload is paused");
              break;
            case "running":
              // console.log("Upload is running");
              break;
            default:
              break;
          }
          if (progress === 100) {
            setIsUploading(false);
            toast.success("uploaded");
          }
        },
        (error) => {
          // A full list of error codes is available at
          // https://firebase.google.com/docs/storage/web/handle-errors
          toast.error("something is wrong in state change");
          console.error(error);
        },
        () => {
          // Upload completed successfully, now we can get the download URL
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            // console.log("File available at", downloadURL);
            setDownloadUrl(downloadURL);
          });
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  // setting contact to firebase DB
  const addContact = async () => {
    try {
      const db = getDatabase(app);
      await set(dbRef(db, "contacts/" + v4()), {
        name,
        email,
        phoneNumber,
        address,
        picture: downloadUrl,
        star,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // to handle update the contact when there is contact in state and the user had came from clicking the contact update icon
  const updateContact = async () => {
    try {
      const db = getDatabase(app);
      await set(dbRef(db, "contacts/" + contactToUpdateKey), {
        name,
        email,
        phoneNumber,
        address,
        picture: downloadUrl,
        star,
      });
    } catch (error) {
      console.log(error);
      toast("Oppss..", { type: "error" });
    }
  };

  // firing when the user click on submit button or the form has been submitted
  const handleSubmit = (e) => {
    e.preventDefault();
    isUpdate ? updateContact() : addContact();

    toast.success("Success");
    // isUpdate wll be true when the user came to update the contact
    // when there is contact then updating and when no contact to update then adding contact

    // to handle the bug when the user visit again to add contact directly by visiting the link
    dispatch({
      type: CONTACT_TO_UPDATE,
      payload: null,
      key: null,
    });

    // after adding/updating contact then sending to the contacts
    navigate("/contacts");
  };

  // return the spinner when the image has been added in the storage
  // showing the update / add contact based on the  state
  return (
    <Container fluid className="mt-5">
      <Row>
        <Col md="6" className="offset-md-3 p-2">
          <Form onSubmit={handleSubmit}>
            <div className="text-center">
              {isUploading ? (
                <Spinner animation="grow" variant="primary" />
              ) : (
                <div>
                  <Form.Label htmlFor="imagepicker" className="">
                    <img src={downloadUrl} alt="" className="profile" />
                  </Form.Label>
                  <input
                    type="file"
                    name="image"
                    id="imagepicker"
                    accept="image/*"
                    multiple={false}
                    onChange={(e) => imagePicker(e)}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            <FormGroup>
              <Form.Control
                type="text"
                name="name"
                id="name"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Form.Control
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />
            </FormGroup>
            <FormGroup>
              <Form.Control
                type="number"
                name="number"
                id="phonenumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="phone number"
              />
            </FormGroup>
            <FormGroup>
              <Form.Control
                type="textarea"
                name="area"
                id="area"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="address"
              />
            </FormGroup>

            <FormGroup check>
              <Form.Label check>
                <Form.Check
                  type="checkbox"
                  onChange={() => {
                    setStar(!star);
                  }}
                  checked={star}
                />{" "}
                <span className="text-right">Mark as Star</span>
              </Form.Label>
            </FormGroup>
            <div className={"d-grid gap-2"}>
              <Button
                type="submit"
                variant="primary"
                block
                className="text-uppercase"
              >
                {isUpdate ? "Update Contact" : "Add Contact"}
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};
export default AddContact;
