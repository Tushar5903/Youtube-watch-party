import React, { useState, useEffect, useContext } from "react";
import { Modal, Button, Table, Alert, Select, Avatar } from "@mantine/core";
import { SignInButton } from "../TopBar/TopBar";
import { serverPath } from "../../utils/utils";
import { SubscribeButton } from "../SubscribeButton/SubscribeButton";
import { MetadataContext } from "../../MetadataContext";
import { IconHourglass } from "@tabler/icons-react";

export const VBrowserModal = ({ closeModal, startVBrowser }) => {
  const context = useContext(MetadataContext);
  const [isFreePoolFull, setIsFreePoolFull] = useState(false);
  const [region, setRegion] = useState("any");

  // Fetch server metadata on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const resp = await fetch(serverPath + "/metadata");
        const metadata = await resp.json();
        setIsFreePoolFull(metadata.isFreePoolFull);
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };
    fetchMetadata();
  }, []);

  const regionOptions = [
    { label: "Any available", value: "any", image: { src: "" } },
    { label: "US East", value: "US", image: { src: "/flag-united-states.png" } },
    { label: "US West", value: "USW", image: { src: "/flag-united-states.png" } },
    { label: "Europe", value: "EU", image: { src: "/flag-european-union.png" } },
  ];

  // Internal Launch Button Component
  const LaunchButton = ({ large }) => (
    <Button
      color={large ? "orange" : undefined}
      onClick={() => {
        startVBrowser({
          size: large ? "large" : "",
          region: region === "any" ? "" : region,
        });
        closeModal();
      }}
    >
      {large ? "Launch VBrowser+" : "Continue with Free"}
    </Button>
  );

  const vmPoolFullMessage = (
    <Alert
      style={{ maxWidth: "300px" }}
      color="red"
      icon={<IconHourglass />}
      title="No Free VBrowsers Available"
    >
      <div>
        <div>All of the free VBrowsers are currently being used.</div>
        <div style={{ marginTop: "8px" }}>
          Please consider subscribing for anytime access to faster VBrowsers, or
          try again later.
        </div>
      </div>
    </Alert>
  );

  // canLaunch logic simplified: assumes login status is handled via context
  const canLaunch = !!context.user;

  return (
    <Modal
      opened
      onClose={closeModal}
      title="Launch a VBrowser"
      centered
      size="auto"
    >
      <div style={{ marginBottom: "16px" }}>
        You're about to launch a virtual browser to share in this room.
      </div>
      
      <Table striped withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th />
            <Table.Th>WatchParty Free</Table.Th>
            <Table.Th>WatchParty Plus</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          <Table.Tr>
            <Table.Td>VBrowser Max Resolution</Table.Td>
            <Table.Td>720p</Table.Td>
            <Table.Td>1080p</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>VBrowser CPU/RAM</Table.Td>
            <Table.Td>Standard</Table.Td>
            <Table.Td>Extra</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>VBrowser Session Length</Table.Td>
            <Table.Td>3 hours</Table.Td>
            <Table.Td>24 hours</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Recommended Max Viewers</Table.Td>
            <Table.Td>15</Table.Td>
            <Table.Td>30</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Region</Table.Td>
            <Table.Td>Where available</Table.Td>
            <Table.Td>
              <Select
                onChange={(value) => setRegion(value)}
                value={region}
                data={regionOptions}
                renderOption={({ option }) => (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    {option.image.src && (
                      <Avatar size="sm" radius="xs" src={option.image.src} />
                    )}
                    {option.label}
                  </div>
                )}
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td></Table.Td>
            <Table.Td>
              {canLaunch ? (
                isFreePoolFull ? (
                  vmPoolFullMessage
                ) : (
                  <LaunchButton large={false} />
                )
              ) : (
                <SignInButton />
              )}
            </Table.Td>
            <Table.Td>
              {context.isSubscriber ? (
                <LaunchButton large />
              ) : (
                <SubscribeButton />
              )}
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Modal>
  );
};