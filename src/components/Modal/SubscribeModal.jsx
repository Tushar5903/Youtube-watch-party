import React, { useContext } from "react";
import { Modal, Title, Table, Button } from "@mantine/core";
import { loadStripe } from "@stripe/stripe-js";
import { SignInButton } from "../TopBar/TopBar";
import config from "../../config";
import { MetadataContext } from "../../MetadataContext";
import { IconBrandStripeFilled, IconCheck } from "@tabler/icons-react";

// Initialize Stripe outside of the component to avoid recreating the object on every render
const stripePromise = config.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(config.VITE_STRIPE_PUBLIC_KEY)
  : null;

export const SubscribeModal = ({ closeSubscribe }) => {
  const context = useContext(MetadataContext);

  const onSubscribe = async () => {
    if (!stripePromise) {
      console.warn("Stripe integration is not configured, cannot subscribe");
      return;
    }

    const stripe = await stripePromise;
    
    // Choose the price ID based on the environment
    const priceId = config.NODE_ENV === "development"
      ? "price_HNGtabCzD5qyfd"
      : "price_HNDBoPDI7yYRi9";

    const result = await stripe?.redirectToCheckout({
      lineItems: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      successUrl: window.location.href,
      cancelUrl: window.location.href,
      customerEmail: context.user?.email || undefined,
      clientReferenceId: context.user?.uid,
    });

    if (result && result.error) {
      console.error(result.error.message);
    }
  };

  return (
    <Modal
      opened
      onClose={closeSubscribe}
      centered
      size="auto"
      title="Subscribe to WatchParty Plus"
    >
      <div style={{ marginBottom: "1rem" }}>
        Subscriptions help us maintain the service and build new features!
        Please consider supporting us if you're enjoying WatchParty.
      </div>
      
      <Title order={6} mb="xs">Features</Title>
      
      <Table striped withTableBorder mb="lg">
        <Table.Thead>
          <Table.Tr>
            <Table.Th />
            <Table.Th>WatchParty Free</Table.Th>
            <Table.Th>WatchParty Plus</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          <Table.Tr>
            <Table.Td>Synchronized watching, chat, screenshare</Table.Td>
            <Table.Td><IconCheck size={18} color="green" /></Table.Td>
            <Table.Td><IconCheck size={18} color="green" /></Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Number of Permanent Rooms</Table.Td>
            <Table.Td>1</Table.Td>
            <Table.Td>20</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>VBrowser Access</Table.Td>
            <Table.Td>When capacity allows</Table.Td>
            <Table.Td>Anytime</Table.Td>
          </Table.Tr>
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
            <Table.Td>VBrowser Region Selection</Table.Td>
            <Table.Td></Table.Td>
            <Table.Td><IconCheck size={18} color="green" /></Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Relay Support (Screen/File Share)</Table.Td>
            <Table.Td></Table.Td>
            <Table.Td><IconCheck size={18} color="green" /></Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Custom room URLs and titles</Table.Td>
            <Table.Td></Table.Td>
            <Table.Td><IconCheck size={18} color="green" /></Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Discord subscriber role</Table.Td>
            <Table.Td></Table.Td>
            <Table.Td><IconCheck size={18} color="green" /></Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Colored names in chat</Table.Td>
            <Table.Td></Table.Td>
            <Table.Td><IconCheck size={18} color="green" /></Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td style={{ fontWeight: 600 }}>Price</Table.Td>
            <Table.Td>$0 / month</Table.Td>
            <Table.Td>$5 / month</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>

      <div style={{ textAlign: "right", marginTop: "1rem" }}>
        {context.user && context.user.email ? (
          <Button
            leftSection={<IconBrandStripeFilled size={20} />}
            color="blue"
            onClick={onSubscribe}
          >
            Subscribe with Stripe
          </Button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
            <span>Please sign in to subscribe:</span> 
            <SignInButton />
          </div>
        )}
      </div>
    </Modal>
  );
};