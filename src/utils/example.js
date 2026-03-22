import { isMagnet, isYouTube } from "./utils";

const rawExamples = [
  {

    url: "https://upload.wikimedia.org/wikipedia/commons/2/22/Tears_of_Steel_-_Blender_Open_Movie_-_full_movie.webm",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Tears_of_Steel_poster.jpg/320px-Tears_of_Steel_poster.jpg"
  },
  {

    url: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Sintel_-_Third_Open_Movie_by_Blender_Foundation_-_full_movie_-_1080p.webm",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Sintel-screenshot-1.jpg/320px-Sintel-screenshot-1.jpg"
  },
  {

    url: "https://upload.wikimedia.org/wikipedia/commons/3/30/Cosmos_Laundromat_-_First_Cycle_-_1080p.webm",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Cosmos_Laundromat_-_First_Cycle.jpg/320px-Cosmos_Laundromat_-_First_Cycle.jpg"
  },
  {

    url: "https://www.youtube.com/watch?v=668nUCeB_P4",
    img: "https://i.ytimg.com/vi/668nUCeB_P4/mqdefault.jpg"
  },
  {

    url: "https://www.youtube.com/watch?v=h8K49dD52WA",
    img: "https://i.ytimg.com/vi/h8K49dD52WA/mqdefault.jpg"
  },
  {

    url: "https://livesim2.dashif.org/livesim2/testpic_2s/Manifest.mpd",
    img: ""
  }
];

export const examples = rawExamples.map((item) => {
  const url = typeof item === "object" ? item.url : item;
  
  let type = "file";
  if (isYouTube(url)) {
    type = "youtube";
  } else if (isMagnet(url)) {
    type = "magnet";
  }

  const img = typeof item === "object" ? item.img : "";
  const name = typeof item === "object" ? item.name : url;

  return {
    url,
    type,
    img,
    name,
    duration: 0, 
  };
});