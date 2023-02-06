import { Flex, Stack,Text } from "@chakra-ui/react";
import { SearchedUser } from "../../../../utils/types";

interface UserSearchListProps{
    users: Array<SearchedUser>
}
const UserSearchList: React.FC<UserSearchListProps> = ({ users }) => {
    return (
        <>
            {users?.length > 0 ? (<Stack>
                
            </Stack>) : (
                <Flex mt={6} justify='center'>
                        <Text>No User Found</Text>
                </Flex>
                )}
        </>
    )
}
export default UserSearchList;