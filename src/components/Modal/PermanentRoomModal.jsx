import React from "react";
import { Modal, Table } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

export const PermanentRoomModal = ({ closeModal }) => {
  return (
    <Modal 
      opened 
      onClose={closeModal} 
      title="Permanent Rooms" 
      centered
      size="lg"
    >
      <div style={{ marginBottom: "1rem" }}>
        Registered users have the ability to make their rooms permanent.
        Subscribed users can create multiple permanent rooms.
      </div>
      
      <Table striped withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th />
            <Table.Th>Temporary</Table.Th>
            <Table.Th>Permanent</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          <Table.Tr>
            <Table.Td style={{ fontWeight: 500 }}>Expiry</Table.Td>
            <Table.Td>After 24 hours of inactivity</Table.Td>
            <Table.Td>Never</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td style={{ fontWeight: 500 }}>Room Passwords</Table.Td>
            <Table.Td></Table.Td>
            <Table.Td>
              <IconCheck size={18} color="green" />
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td style={{ fontWeight: 500 }}>Disable Chat</Table.Td>
            <Table.Td></Table.Td>
            <Table.Td>
              <IconCheck size={18} color="green" />
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td style={{ fontWeight: 500 }}>Kick Users</Table.Td>
            <Table.Td></Table.Td>
            <Table.Td>
              <IconCheck size={18} color="green" />
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td style={{ fontWeight: 500 }}>Custom Room URLs</Table.Td>
            <Table.Td></Table.Td>
            <Table.Td>
              <IconCheck size={18} color="green" />
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Modal>
  );
};