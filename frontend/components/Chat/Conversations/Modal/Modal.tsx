import { useLazyQuery, useMutation } from "@apollo/client";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Text,
  Modal,
  Stack,
  Input,
  Button,
} from "@chakra-ui/react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import UserOperations from "../../../../graphql/operations/users";
import ConversationOperations from "../../../../graphql/operations/conversation";
import {
  CreateConversationData,
  CreateConversationInput,
  SearchedUser,
  SearchUserInput,
  SearchUsersData,
} from "../../../../utils/types";
import Participants from "./Participants";
import UserSearchList from "./UserSearchList";
import { Session } from "next-auth";
import { useRouter } from "next/router";
import { ConversationPopulated } from "../../../../../backend/src/util/types";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  conversations: Array<ConversationPopulated>;

}

const ConversationModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  session,
  conversations
}) => {
  const {
    user: { id: userId },
  } = session;

  const router = useRouter();

  const [username, setUsername] = useState("");
  //users selected
  const [participants, setParticipants] = useState<Array<SearchedUser>>([]);
  const [exisitingConversations, setExistingConversation] =
    useState<ConversationPopulated | null>(null);
  //async is handle by lazyquery
  const [searchUsers, { data, error, loading }] = useLazyQuery<
    SearchUsersData,
    SearchUserInput
  >(UserOperations.Queries.searchUsers); //choose exactly when to execute the query

  const [createConversation, { loading: createConversationLoading }] =
    useMutation<CreateConversationData, CreateConversationInput>(
      ConversationOperations.Mutations.createConversation
    );

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault();
    //search user query
    searchUsers({ variables: { username } });
  };

  const addParticipant = (user: SearchedUser) => {
    setParticipants((prev) => [...prev, user]);
    setUsername("");
  };

  const removeParticipant = (userId: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== userId));
  };

  const onCreateConversation = async () => {
    const participantIds = [
      userId,
      ...participants.map((participant) => participant.id),
    ];
    try {
      //create Conversation mutation
      const { data, errors } = await createConversation({
        variables: { participantIds },
      });
      if (!data?.createConversation || errors) {
        throw new Error("Failed to create conversation");
      }
      const {
        createConversation: { conversationId },
      } = data;
      router.push({ query: { conversationId } }); //we route to thee new conversation link
      /**
       * Clear state and close modal
       * on Successfull creation
       */
    } catch (error: any) {
      toast.error(error?.message);
    }
  };
  const findExistingConversation = (participantIds: Array<string>) => {
    let existingConversation: ConversationPopulated | null = null;
    for (const conversation of conversations) {
      const addedParticipants = conversation.participants.filter((p: any) => p.user.id !== userId)
      if (addedParticipants.length !== participantIds.length) { 
        continue;
      }
      let allMatchingParticipants: boolean = false;
      for (const participant of addedParticipants) {
        const foundParticipant = participantIds.find((p) => p === participant.user.id);
if (!foundParticipant) {
  allMatchingParticipants = false
  break;
        }
        allMatchingParticipants = true;
        
      
      }
      if (allMatchingParticipants) {
        existingConversation=conversation
      }

      
    }
    return existingConversation
}
  const onSubmit = () => {
    if (!participants.length) {
      return;
    }
    const participantIds = participants.map((p) => p.id);
    const existing = findExistingConversation(participantIds);
    if (existing) {
      toast("Conversation already exists");
      setExistingConversation(existing);
      return;
    }
    editingConversation?onUpdateConversation(editingConversation):onCreateConversation()
  };

  const onUpdateConversation = async (conversation: ConversationPopulated) => {
    const participantIds = participants.map((p) => p.id);
    try {
      const { data, errors } = await updateParticipants({
        variables: {
          conversationId: conversation.id,
          participantIds,
        }
      })
      if (!data?.updateParticipants || errors) {
        throw new Error("Failed to update Participant")
      }
    } catch (error) {
      console.log("onUpdateConversation error", error)
      toast.error("Failed to update participants")
    }
}

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="#2d2d2d" pb={4}>
          <ModalHeader>Create a Conversation</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={onSearch}>
              <Stack>
                <Input
                  placeholder="Enter a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <Button type="submit" disabled={!username} isLoading={loading}>
                  Search
                </Button>
              </Stack>
            </form>
            {data?.searchUsers && (
              <UserSearchList
                users={data?.searchUsers}
                addParticipants={addParticipant}
              />
            )}
            {participants.length !== 0 && (
              <>
                <Participants
                  participants={participants}
                  removeParticipant={removeParticipant}
                />
                <Button
                  bg="brand.100"
                  width="100%"
                  mt={6}
                  _hover={{ bg: "brand.100" }}
                  onClick={onCreateConversation}
                  isLoading={createConversationLoading}
                >
                  Create Conversation
                </Button>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
export default ConversationModal;
