'use client';
import Chat from "./components/Chat";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';


export default function Home() {
  return (
    <Authenticator>
      <Chat />
    </Authenticator>
  );
}
