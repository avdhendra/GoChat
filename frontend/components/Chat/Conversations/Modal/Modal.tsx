import { useLazyQuery } from "@apollo/client";
import { ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Text, Modal, Stack, Input, Button } from "@chakra-ui/react"
import { useState } from "react";
import UserOperations  from '../../../../graphql/operations/users'
import { SearchUserInput, SearchUsersData } from "../../../../utils/types";
import UserSearchList from "./UserSearchList";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ConversationModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
    const [username, setUsername] = useState("")
    //async is handle by lazyquery
    const [searchUsers,{data,error,loading}]=useLazyQuery<SearchUsersData,SearchUserInput>(UserOperations.Queries.searchUsers) //choose exactly when to execute the query
  
    const onSearch =  (event: React.FormEvent) => {
    
        event.preventDefault();
    //search user query
        searchUsers({ variables: { username } });
        
        
}

    return (
        <>

            <Modal isOpen={isOpen} onClose={onClose} >
                <ModalOverlay />
                <ModalContent bg="#2d2d2d" pb={4}>
                    <ModalHeader>Create a Conversation</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <form onSubmit={onSearch}>
                            <Stack>
                                <Input placeholder="Enter a username" value={username} onChange={(e) => setUsername(e.target.value)} />
                                <Button type="submit" disabled={!username} isLoading={loading}>Search</Button>
                            </Stack>
                        </form>
                        {data?.searchUsers && <UserSearchList users={data?.searchUsers } />}
                    </ModalBody>


                </ModalContent>
            </Modal>
        </>
    )
}
export default ConversationModal