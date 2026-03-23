import React, { useState } from "react";
import {
  Modal,
  Button,
  Alert,
  TextInput,
  PasswordInput,
  Divider,
} from "@mantine/core";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

export const LoginModal = ({ closeModal }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [error, setError] = useState("");

  const emailSignIn = async (e) => {
    e.preventDefault();
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      closeModal();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      {showCreate && (
        <CreateModal closeModal={() => setShowCreate(false)} />
      )}
      {showReset && (
        <ResetModal closeModal={() => setShowReset(false)} />
      )}

      <Modal opened onClose={closeModal} title="Login" size="auto" centered>
        <div>
          <form
            onSubmit={emailSignIn}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {error && (
              <Alert color="red" title="Error">
                {error}
              </Alert>
            )}
            <TextInput
              label="Email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <PasswordInput
              label="Password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit">Login</Button>
          </form>

          <Divider label="Or" labelPosition="center" my="lg" />

          <div
            style={{
              display: "flex",
              gap: "4px",
              justifyContent: "center",
            }}
          >
            <Button
              variant="subtle"
              size="xs"
              onClick={() => setShowCreate(true)}
            >
              Create account
            </Button>
            <Button
              variant="subtle"
              size="xs"
              onClick={() => setShowReset(true)}
            >
              Reset password
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export const CreateModal = ({ closeModal }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const createAccount = async (e) => {
    e.preventDefault();
    try {
      await firebase.auth().createUserWithEmailAndPassword(email, password);
      closeModal();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Modal
      opened
      onClose={closeModal}
      title="Create an account"
      size="auto"
      centered
    >
      <form
        onSubmit={createAccount}
        style={{ display: "flex", flexDirection: "column", gap: "8px" }}
      >
        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}
        <TextInput
          label="Email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordInput
          label="Password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit">Create</Button>
      </form>
    </Modal>
  );
};

export const ResetModal = ({ closeModal }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const resetPassword = async (e) => {
    e.preventDefault();
    try {
      await firebase.auth().sendPasswordResetEmail(email);
      closeModal();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Modal opened onClose={closeModal} title="Reset password" centered>
      <form
        onSubmit={resetPassword}
        style={{ display: "flex", flexDirection: "column", gap: "8px" }}
      >
        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}
        <TextInput
          label="Email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit">Reset</Button>
      </form>
    </Modal>
  );
};
