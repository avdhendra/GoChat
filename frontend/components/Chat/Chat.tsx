import { Button, Flex } from "@chakra-ui/react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import ConversationsWrapper from "./Conversations/ConversationsWrapper";
import FeedWrapper from "./Feed/FeedWrapper";
import ModalProvider from "../../context/ModalContext";
interface IChatProps {
session:Session
}

const Chat: React.FC<IChatProps> = ({session}) => {
    return (
      <Flex height="100vh">
        <ModalProvider>
        <ConversationsWrapper session={session} />
        <FeedWrapper session={session} />
        </ModalProvider>

      </Flex>
  );
};

export default Chat;
