import { createContext, useContext, useState, useEffect } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

interface TourContextType {
  tour: Shepherd.Tour | null;
  startTour: () => void;
  endTour: () => void;
  isActive: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [tour, setTour] = useState<Shepherd.Tour | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const newTour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shadow-md rounded-lg',
        scrollTo: true,
        cancelIcon: {
          enabled: true
        }
      }
    });

    // Define tour steps
    newTour.addStep({
      id: 'welcome',
      text: 'Welcome to Agapi! Let\'s take a quick tour of the key features.',
      attachTo: {
        element: '.main-content',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Skip',
          action: () => newTour.complete()
        },
        {
          text: 'Start',
          action: () => newTour.next()
        }
      ]
    });

    newTour.addStep({
      id: 'create-post',
      text: 'Share your thoughts by creating a new post here.',
      attachTo: {
        element: '.post-form',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Back',
          action: () => newTour.back()
        },
        {
          text: 'Next',
          action: () => newTour.next()
        }
      ]
    });

    newTour.addStep({
      id: 'ai-interactions',
      text: 'Your AI followers will engage with your posts through likes, comments, and replies.',
      attachTo: {
        element: '.post-card',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Back',
          action: () => newTour.back()
        },
        {
          text: 'Next',
          action: () => newTour.next()
        }
      ]
    });

    newTour.addStep({
      id: 'reply-interaction',
      text: 'Click here to reply to AI comments and start engaging conversations.',
      attachTo: {
        element: '.reply-button',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Back',
          action: () => newTour.back()
        },
        {
          text: 'Done',
          action: () => newTour.complete()
        }
      ]
    });

    setTour(newTour);

    return () => {
      newTour.complete();
    };
  }, []);

  const startTour = () => {
    if (tour) {
      setIsActive(true);
      tour.start();
    }
  };

  const endTour = () => {
    if (tour) {
      setIsActive(false);
      tour.complete();
    }
  };

  return (
    <TourContext.Provider value={{ tour, startTour, endTour, isActive }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
