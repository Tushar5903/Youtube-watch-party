import React, { useContext, useState } from "react";
import { Modal, Loader, Menu, Text, Checkbox } from "@mantine/core";
import { IconFile } from "@tabler/icons-react";
import { MetadataContext } from "../../MetadataContext";

export const MultiStreamModal = ({
  streams,
  setMedia,
  resetMultiSelect,
  startConvert,
}) => {
  const context = useContext(MetadataContext);
  const [convert, setConvert] = useState(false);

  return (
    <Modal 
      opened 
      onClose={resetMultiSelect} 
      centered 
      title="Select a file"
    >
      {streams.length === 0 ? (
        <Loader />
      ) : (
        <>
          <Checkbox
            disabled={!context.isSubscriber}
            label="Convert media (use if no video or audio)"
            checked={convert}
            onChange={(e) => setConvert(e.target.checked)}
          />
          <Menu shadow="md">
            {streams.map((file, index) => (
              <Menu.Item
                key={index}
                leftSection={<IconFile />}
                onClick={() => {
                  if (convert) {
                    startConvert(file.url);
                  } else {
                    setMedia(file.url);
                  }
                  resetMultiSelect();
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Text size="sm" fw={500}>{file.name}</Text>
                  <Text size="xs" c="dimmed">
                    {file.length.toLocaleString()} bytes
                  </Text>
                </div>
              </Menu.Item>
            ))}
          </Menu>
        </>
      )}
    </Modal>
  );
};