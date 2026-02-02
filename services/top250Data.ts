

export interface Award {
  type: string;
  status: string;
  description: string;
}

export interface Top250Movie {
  title: string;
  id: string;
  currentRating: number | null;
  awards: Award[];
}

// Helper to clean titles for matching (remove year, lowercase, remove special chars)
const normalizeTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/\(\d{4}\)/, '') // Remove year
    .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
    .trim();
};

export const findMovieInTop250 = (rutubeTitle: string): Top250Movie | undefined => {
  if (!rutubeTitle) return undefined;

  const normalizedRutube = rutubeTitle.toLowerCase();

  return TOP_250_MOVIES.find(movie => {
    // 1. Exact English Title Match (most reliable if English is present)
    const dbTitleBase = movie.title.replace(/\s*\(\d{4}\)/, '').trim();
    if (normalizedRutube.includes(dbTitleBase.toLowerCase())) {
        return true;
    }
    
    // 2. Year + Partial Match (if year exists in both)
    // Extract year from DB
    const dbYearMatch = movie.title.match(/\((\d{4})\)/);
    const dbYear = dbYearMatch ? dbYearMatch[1] : null;
    
    // If Rutube title has the same year, check for significant word overlap
    if (dbYear && normalizedRutube.includes(dbYear)) {
        // Very basic heuristic: check if the first long word matches
        const firstLongWord = dbTitleBase.split(' ').find(w => w.length > 4);
        if (firstLongWord && normalizedRutube.includes(firstLongWord.toLowerCase())) {
            return true;
        }
    }

    return false;
  });
};

export const TOP_250_MOVIES: Top250Movie[] = [
  {
    "title": "A Beautiful Mind (2001)",
    "id": "0268978",
    "currentRating": 8.38,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "A Bronx Tale (1993)",
    "id": "0106489",
    "currentRating": 8,
    "awards": []
  },
  {
    "title": "A Bug's Life (1998)",
    "id": "0120623",
    "currentRating": 7.46,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "A Charlie Brown Christmas (1965)",
    "id": "0059026",
    "currentRating": 7.5,
    "awards": []
  },
  {
    "title": "A Christmas Story (1983)",
    "id": "0085334",
    "currentRating": 7.22,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "A Clockwork Orange (1971)",
    "id": "0066921",
    "currentRating": 8.75,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "A Close Shave (1995)",
    "id": "0112691",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      }
    ]
  },
  {
    "title": "A Few Good Men (1992)",
    "id": "0104257",
    "currentRating": 8.13,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "A Fish Called Wanda (1988)",
    "id": "0095159",
    "currentRating": 7.71,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "A Grand Day Out (1989)",
    "id": "0104361",
    "currentRating": 7.43,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "A Man for All Seasons (1966)",
    "id": "0060665",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "A Night at the Opera (1935)",
    "id": "0026778",
    "currentRating": 8.33,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "A River Runs Through It (1992)",
    "id": "0105265",
    "currentRating": 7,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "A Room with a View (1985)",
    "id": "0091867",
    "currentRating": 7,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "A Simple Plan (1998)",
    "id": "0120324",
    "currentRating": 7.83,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "A Star Is Born (2018)",
    "id": "1517451",
    "currentRating": 7.33,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "A Streetcar Named Desire (1951)",
    "id": "0044081",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "A Time to Kill (1996)",
    "id": "0117913",
    "currentRating": 7.25,
    "awards": []
  },
  {
    "title": "A Wednesday (2008)",
    "id": "1280558",
    "currentRating": 8.5,
    "awards": []
  },
  {
    "title": "About Schmidt (2002)",
    "id": "0257360",
    "currentRating": 7.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Ace in the Hole (1951)",
    "id": "0043338",
    "currentRating": 8.2,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Adaptation. (2002)",
    "id": "0268126",
    "currentRating": 7.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Aguirre, der Zorn Gottes (1972)",
    "id": "0068182",
    "currentRating": 7,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Ah-ga-ssi (2016)",
    "id": "4016934",
    "currentRating": 8.13,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Ainda Estou Aqui (2024)",
    "id": "14961016",
    "currentRating": 8.43,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Air Force One (1997)",
    "id": "0118571",
    "currentRating": 7.11,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Airlift (2016)",
    "id": "4387040",
    "currentRating": 9,
    "awards": []
  },
  {
    "title": "Airplane! (1980)",
    "id": "0080339",
    "currentRating": 7.85,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Akira (1988)",
    "id": "0094625",
    "currentRating": 7.7,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Aladdin (1992)",
    "id": "0103639",
    "currentRating": 7.63,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Alien (1979)",
    "id": "0078748",
    "currentRating": 8.6,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Aliens (1986)",
    "id": "0090605",
    "currentRating": 8.88,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "All About Eve (1950)",
    "id": "0042192",
    "currentRating": 8.43,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "All Quiet on the Western Front (1930)",
    "id": "0020629",
    "currentRating": 8.3,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "All the President's Men (1976)",
    "id": "0074119",
    "currentRating": 8.11,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Almost Famous (2000)",
    "id": "0181875",
    "currentRating": 7.58,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Amadeus (1984)",
    "id": "0086879",
    "currentRating": 8.6,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Amarcord (1973)",
    "id": "0071129",
    "currentRating": 8.25,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "American Beauty (1999)",
    "id": "0169547",
    "currentRating": 8.44,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "American Gangster (2007)",
    "id": "0765429",
    "currentRating": 8.44,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "American Graffiti (1973)",
    "id": "0069704",
    "currentRating": 6.8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "American History X (1998)",
    "id": "0120586",
    "currentRating": 8.63,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Amores perros (2000)",
    "id": "0245712",
    "currentRating": 8.13,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Anand (1971)",
    "id": "0066763",
    "currentRating": 5.33,
    "awards": []
  },
  {
    "title": "Anatomy of a Murder (1959)",
    "id": "0052561",
    "currentRating": 8.56,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Andaz Apna Apna (1994)",
    "id": "0109117",
    "currentRating": 6.67,
    "awards": []
  },
  {
    "title": "Andhadhun (2018)",
    "id": "8108198",
    "currentRating": 8.29,
    "awards": []
  },
  {
    "title": "Andrei Rublev (1966)",
    "id": "0060107",
    "currentRating": 7,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Anne of Green Gables (1985)",
    "id": "0088727",
    "currentRating": null,
    "awards": []
  },
  {
    "title": "Annie Hall (1977)",
    "id": "0075686",
    "currentRating": 7.67,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Antonia (1995)",
    "id": "0112379",
    "currentRating": 7,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      }
    ]
  },
  {
    "title": "Antz (1998)",
    "id": "0120587",
    "currentRating": 7.25,
    "awards": []
  },
  {
    "title": "Apocalypse Now (1979)",
    "id": "0078788",
    "currentRating": 8.21,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      },
      {
        "type": "Palme d'Or",
        "status": "Nominated",
        "description": "Palme d'Or"
      }
    ]
  },
  {
    "title": "Apollo 13 (1995)",
    "id": "0112384",
    "currentRating": 7.9,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Ararat (2002)",
    "id": "0273435",
    "currentRating": 8,
    "awards": []
  },
  {
    "title": "Argo (2012)",
    "id": "1024648",
    "currentRating": 8.23,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Army of Darkness (1992)",
    "id": "0106308",
    "currentRating": 6.71,
    "awards": []
  },
  {
    "title": "Arrival (2016)",
    "id": "2543164",
    "currentRating": 8.07,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Arsenic and Old Lace (1944)",
    "id": "0036613",
    "currentRating": 7.8,
    "awards": []
  },
  {
    "title": "As Good as It Gets (1997)",
    "id": "0119822",
    "currentRating": 8.13,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Atonement (2007)",
    "id": "0783233",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Au revoir les enfants (1987)",
    "id": "0092593",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Avatar (2009)",
    "id": "0499549",
    "currentRating": 7.63,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Avengers: Age of Ultron (2015)",
    "id": "2395427",
    "currentRating": 6.43,
    "awards": []
  },
  {
    "title": "Avengers: Endgame (2019)",
    "id": "4154796",
    "currentRating": 8.46,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Avengers: Infinity War (2018)",
    "id": "4154756",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Awakenings (1990)",
    "id": "0099077",
    "currentRating": 8.33,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Ayla: The Daughter of War (2017)",
    "id": "6316138",
    "currentRating": 8.5,
    "awards": []
  },
  {
    "title": "Ba wang bie ji (1993)",
    "id": "0106332",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      },
      {
        "type": "Palme d'Or",
        "status": "Nominated",
        "description": "Palme d'Or"
      }
    ]
  },
  {
    "title": "Babam Ve Oglum (2005)",
    "id": "0476735",
    "currentRating": 8.45,
    "awards": []
  },
  {
    "title": "Babe (1995)",
    "id": "0112431",
    "currentRating": 7.56,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Baby Driver (2017)",
    "id": "3890160",
    "currentRating": 8.54,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Bacheha-Ye aseman (1997)",
    "id": "0118849",
    "currentRating": 8.13,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Back to the Future (1985)",
    "id": "0088763",
    "currentRating": 8.81,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Bad Taste (1987)",
    "id": "0092610",
    "currentRating": 7.25,
    "awards": []
  },
  {
    "title": "Bambi (1942)",
    "id": "0034492",
    "currentRating": 7.17,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Barry Lyndon (1975)",
    "id": "0072684",
    "currentRating": 8.42,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Batman Begins (2005)",
    "id": "0372784",
    "currentRating": 7.94,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Beautiful Thing (1996)",
    "id": "0115640",
    "currentRating": 7.33,
    "awards": []
  },
  {
    "title": "Beauty and the Beast (1991)",
    "id": "0101414",
    "currentRating": 7.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Before Midnight (2013)",
    "id": "2209418",
    "currentRating": 8.38,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Before Sunrise (1995)",
    "id": "0112471",
    "currentRating": 8.1,
    "awards": []
  },
  {
    "title": "Before Sunset (2004)",
    "id": "0381681",
    "currentRating": 8.17,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Being John Malkovich (1999)",
    "id": "0120601",
    "currentRating": 7.75,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Being There (1979)",
    "id": "0078841",
    "currentRating": 8.75,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Ben-Hur (1959)",
    "id": "0052618",
    "currentRating": 8.31,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Better Off Dead... (1985)",
    "id": "0088794",
    "currentRating": 6.67,
    "awards": []
  },
  {
    "title": "Bhaag Milkha Bhaag (2013)",
    "id": "2356180",
    "currentRating": 8.67,
    "awards": []
  },
  {
    "title": "Big Fish (2003)",
    "id": "0319061",
    "currentRating": 6.8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Big Night (1996)",
    "id": "0115678",
    "currentRating": 7.33,
    "awards": []
  },
  {
    "title": "Billy Elliot (2000)",
    "id": "0249462",
    "currentRating": 7.67,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Bin-jip (2004)",
    "id": "0423866",
    "currentRating": 8,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Birdman: Or (The Unexpected Virtue of Ignorance) (2014)",
    "id": "2562232",
    "currentRating": 8.25,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Bis ans Ende der Welt (1991)",
    "id": "0101458",
    "currentRating": 6.5,
    "awards": []
  },
  {
    "title": "Black Hawk Down (2001)",
    "id": "0265086",
    "currentRating": 7.33,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Black Swan (2010)",
    "id": "0947798",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Blade Runner (1982)",
    "id": "0083658",
    "currentRating": 8.13,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Blade Runner 2049 (2017)",
    "id": "1856101",
    "currentRating": 8.62,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Blazing Saddles (1974)",
    "id": "0071230",
    "currentRating": 7.8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Blood Diamond (2006)",
    "id": "0450259",
    "currentRating": 8.33,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Blood Simple (1984)",
    "id": "0086979",
    "currentRating": 7.5,
    "awards": []
  },
  {
    "title": "Blue Velvet (1986)",
    "id": "0090756",
    "currentRating": 7.38,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Bohemian Rhapsody (2018)",
    "id": "1727824",
    "currentRating": 7.73,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Bom yeoreum gaeul gyeoul geurigo bom (2003)",
    "id": "0374546",
    "currentRating": 8.56,
    "awards": []
  },
  {
    "title": "Bonnie and Clyde (1967)",
    "id": "0061418",
    "currentRating": 8.2,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Borat: Cultural Learnings of America for Make Benefit Glorious Nation of Kazakhstan (2006)",
    "id": "0443453",
    "currentRating": 7.88,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Bound (1996)",
    "id": "0115736",
    "currentRating": 8.67,
    "awards": []
  },
  {
    "title": "Boyhood (2014)",
    "id": "1065073",
    "currentRating": 8.3,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Boys Don't Cry (1999)",
    "id": "0171804",
    "currentRating": 7.75,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Boyz n the Hood (1991)",
    "id": "0101507",
    "currentRating": 8.33,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Braindead (1992)",
    "id": "0103873",
    "currentRating": 5.8,
    "awards": []
  },
  {
    "title": "Braveheart (1995)",
    "id": "0112573",
    "currentRating": 8.38,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Brazil (1985)",
    "id": "0088846",
    "currentRating": 7.22,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Breakfast at Tiffany's (1961)",
    "id": "0054698",
    "currentRating": 7.4,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Breaking the Waves (1996)",
    "id": "0115751",
    "currentRating": 8.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Bride of Frankenstein (1935)",
    "id": "0026138",
    "currentRating": 7.8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Brief Encounter (1945)",
    "id": "0037558",
    "currentRating": 8.13,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      },
      {
        "type": "Palme d'Or",
        "status": "Nominated",
        "description": "Palme d'Or"
      }
    ]
  },
  {
    "title": "Bringing Up Baby (1938)",
    "id": "0029947",
    "currentRating": 7.86,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Brokeback Mountain (2005)",
    "id": "0388795",
    "currentRating": 7.25,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Bronenosets Potemkin (1925)",
    "id": "0015648",
    "currentRating": 7.5,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Bullets Over Broadway (1994)",
    "id": "0109348",
    "currentRating": 7.67,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Butch Cassidy and the Sundance Kid (1969)",
    "id": "0064115",
    "currentRating": 8.17,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "C'era una volta il West (1968)",
    "id": "0064116",
    "currentRating": 8.47,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "C'est arrivé près de chez vous (1992)",
    "id": "0103905",
    "currentRating": 7.67,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Cabaret (1972)",
    "id": "0068327",
    "currentRating": 7.8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Call Me by Your Name (2017)",
    "id": "5726616",
    "currentRating": 8.4,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Capharnaüm (2018)",
    "id": "8267604",
    "currentRating": 8.3,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Captain America: Civil War (2016)",
    "id": "3498820",
    "currentRating": 7.7,
    "awards": []
  },
  {
    "title": "Captain America: The Winter Soldier (2014)",
    "id": "1843866",
    "currentRating": 7.64,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Carlito's Way (1993)",
    "id": "0106519",
    "currentRating": 7.38,
    "awards": []
  },
  {
    "title": "Casablanca (1942)",
    "id": "0034583",
    "currentRating": 8.56,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Casino (1995)",
    "id": "0112641",
    "currentRating": 8.33,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Casino Royale (2006)",
    "id": "0381061",
    "currentRating": 7.64,
    "awards": []
  },
  {
    "title": "Cast Away (2000)",
    "id": "0162222",
    "currentRating": 7.75,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Catch Me If You Can (2002)",
    "id": "0264464",
    "currentRating": 7.58,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Central do Brasil (1998)",
    "id": "0140888",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Chak De! India (2007)",
    "id": "0871510",
    "currentRating": 8.25,
    "awards": []
  },
  {
    "title": "Changeling (2008)",
    "id": "0824747",
    "currentRating": 8.6,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Charade (1963)",
    "id": "0056923",
    "currentRating": 9.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Chasing Amy (1997)",
    "id": "0118842",
    "currentRating": 6.71,
    "awards": []
  },
  {
    "title": "Cheech & Chong's Next Movie (1980)",
    "id": "0080520",
    "currentRating": 6.5,
    "awards": []
  },
  {
    "title": "Chicago (2002)",
    "id": "0299658",
    "currentRating": 7.91,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Chicken Run (2000)",
    "id": "0120630",
    "currentRating": 7.11,
    "awards": []
  },
  {
    "title": "Children of Men (2006)",
    "id": "0206634",
    "currentRating": 8.67,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Chinatown (1974)",
    "id": "0071315",
    "currentRating": 8.42,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Chung Hing sam lam (1994)",
    "id": "0109424",
    "currentRating": 7.25,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Cidade de Deus (2002)",
    "id": "0317248",
    "currentRating": 8.88,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Cinderella Man (2005)",
    "id": "0352248",
    "currentRating": 8.33,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Citizen Kane (1941)",
    "id": "0033467",
    "currentRating": 7.83,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "City Lights (1931)",
    "id": "0021749",
    "currentRating": 8.25,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Clerks. (1994)",
    "id": "0109445",
    "currentRating": 7.8,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Close Encounters of the Third Kind (1977)",
    "id": "0075860",
    "currentRating": 8.4,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Clueless (1995)",
    "id": "0112697",
    "currentRating": 7.25,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "CM101MMXI Fundamentals (2013)",
    "id": "2592910",
    "currentRating": 8,
    "awards": []
  },
  {
    "title": "Coco (2017)",
    "id": "2380307",
    "currentRating": 8.77,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      }
    ]
  },
  {
    "title": "Como agua para chocolate (1992)",
    "id": "0103994",
    "currentRating": 8,
    "awards": []
  },
  {
    "title": "Contact (1997)",
    "id": "0118884",
    "currentRating": 8.29,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Contratiempo (2016)",
    "id": "4857264",
    "currentRating": 8.43,
    "awards": []
  },
  {
    "title": "Cool Hand Luke (1967)",
    "id": "0061512",
    "currentRating": 7.83,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Coraline (2009)",
    "id": "0327597",
    "currentRating": 6.7,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Courage Under Fire (1996)",
    "id": "0115956",
    "currentRating": 7,
    "awards": []
  },
  {
    "title": "Crash (2004)",
    "id": "0375679",
    "currentRating": 7.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Creed (2015)",
    "id": "3076658",
    "currentRating": 7.89,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Crimes and Misdemeanors (1989)",
    "id": "0097123",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Crimson Tide (1995)",
    "id": "0112740",
    "currentRating": 8.67,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Crna macka, beli macor (1998)",
    "id": "0118843",
    "currentRating": 7.33,
    "awards": []
  },
  {
    "title": "Cyrano (2021)",
    "id": "11278832",
    "currentRating": 6.4,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Cyrano de Bergerac (1990)",
    "id": "0099334",
    "currentRating": 7,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Da hong deng long gao gao gua (1991)",
    "id": "0101640",
    "currentRating": 8.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Dancer in the Dark (2000)",
    "id": "0168629",
    "currentRating": 6.17,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      },
      {
        "type": "Palme d'Or",
        "status": "Nominated",
        "description": "Palme d'Or"
      }
    ]
  },
  {
    "title": "Dances with Wolves (1990)",
    "id": "0099348",
    "currentRating": 7.83,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Dangal (2016)",
    "id": "5074352",
    "currentRating": 7.62,
    "awards": []
  },
  {
    "title": "Dangerous Liaisons (1988)",
    "id": "0094947",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Das Boot (1981)",
    "id": "0082096",
    "currentRating": 8.58,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Das Cabinet des Dr. Caligari (1920)",
    "id": "0010323",
    "currentRating": 8.38,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Das Leben der Anderen (2006)",
    "id": "0405094",
    "currentRating": 8.73,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Dawn of the Dead (1978)",
    "id": "0077402",
    "currentRating": 8.5,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Dawn of the Planet of the Apes (2014)",
    "id": "2103281",
    "currentRating": 7.7,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Dazed and Confused (1993)",
    "id": "0106677",
    "currentRating": 7.38,
    "awards": []
  },
  {
    "title": "Dead Again (1991)",
    "id": "0101669",
    "currentRating": 8,
    "awards": []
  },
  {
    "title": "Dead Man (1995)",
    "id": "0112817",
    "currentRating": 6.75,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Dead Man Walking (1995)",
    "id": "0112818",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Dead Poets Society (1989)",
    "id": "0097165",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Deadpool (2016)",
    "id": "1431045",
    "currentRating": 7.75,
    "awards": []
  },
  {
    "title": "Deadpool & Wolverine (2024)",
    "id": "6263850",
    "currentRating": 8.25,
    "awards": []
  },
  {
    "title": "Deadpool 2 (2018)",
    "id": "5463162",
    "currentRating": 7.33,
    "awards": []
  },
  {
    "title": "Dear Frankie (2004)",
    "id": "0377752",
    "currentRating": 8.25,
    "awards": []
  },
  {
    "title": "Delicatessen (1991)",
    "id": "0101700",
    "currentRating": 6.83,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Deliverance (1972)",
    "id": "0068473",
    "currentRating": 8.25,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Der Himmel über Berlin (1987)",
    "id": "0093191",
    "currentRating": 7.6,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Der Name der Rose (1986)",
    "id": "0091605",
    "currentRating": 8,
    "awards": []
  },
  {
    "title": "Der Untergang (2004)",
    "id": "0363163",
    "currentRating": 8.47,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Dersu Uzala (1975)",
    "id": "0071411",
    "currentRating": 7.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Dev.D (2009)",
    "id": "1327035",
    "currentRating": 7,
    "awards": []
  },
  {
    "title": "Dhurandhar (2025)",
    "id": "33014583",
    "currentRating": 10,
    "awards": []
  },
  {
    "title": "Dial M for Murder (1954)",
    "id": "0046912",
    "currentRating": 8.76,
    "awards": []
  },
  {
    "title": "Diarios de motocicleta (2004)",
    "id": "0318462",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Die Hard (1988)",
    "id": "0095016",
    "currentRating": 8.88,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Dil Bechara (2020)",
    "id": "8110330",
    "currentRating": 7,
    "awards": []
  },
  {
    "title": "Dil Chahta Hai (2001)",
    "id": "0292490",
    "currentRating": 8,
    "awards": []
  },
  {
    "title": "Dip huet seung hung (1989)",
    "id": "0097202",
    "currentRating": 8.25,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "District 9 (2009)",
    "id": "1136608",
    "currentRating": 7.8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Diva (1981)",
    "id": "0082269",
    "currentRating": 7.67,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Django Unchained (2012)",
    "id": "1853728",
    "currentRating": 7.94,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Doctor Zhivago (1965)",
    "id": "0059113",
    "currentRating": 8.67,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Dog Day Afternoon (1975)",
    "id": "0072890",
    "currentRating": 8.7,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Dogma (1999)",
    "id": "0120655",
    "currentRating": 7.57,
    "awards": []
  },
  {
    "title": "Dogville (2003)",
    "id": "0276919",
    "currentRating": 8.25,
    "awards": []
  },
  {
    "title": "Dom za vesanje (1988)",
    "id": "0097223",
    "currentRating": 6.25,
    "awards": []
  },
  {
    "title": "Don Juan DeMarco (1994)",
    "id": "0112883",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Don't Look Up (2021)",
    "id": "11286314",
    "currentRating": 7.2,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Donnie Brasco (1997)",
    "id": "0119008",
    "currentRating": 7.89,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Donnie Darko (2001)",
    "id": "0246578",
    "currentRating": 8.4,
    "awards": []
  },
  {
    "title": "Double Indemnity (1944)",
    "id": "0036775",
    "currentRating": 8.25,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Down by Law (1986)",
    "id": "0090967",
    "currentRating": 5.5,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb (1964)",
    "id": "0057012",
    "currentRating": 8.06,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Drishyam (2013)",
    "id": "3417422",
    "currentRating": 8,
    "awards": []
  },
  {
    "title": "Drishyam (2015)",
    "id": "4430212",
    "currentRating": 8.14,
    "awards": []
  },
  {
    "title": "Drishyam 2 (2021)",
    "id": "12361178",
    "currentRating": 6.5,
    "awards": []
  },
  {
    "title": "Drive (2011)",
    "id": "0780504",
    "currentRating": 8.42,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Driving Miss Daisy (1989)",
    "id": "0097239",
    "currentRating": 7.86,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Du Rififi chez les hommes (1955)",
    "id": "0048021",
    "currentRating": 7.89,
    "awards": []
  },
  {
    "title": "Duck Soup (1933)",
    "id": "0023969",
    "currentRating": 7.88,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Due South (1994)",
    "id": "0108756",
    "currentRating": null,
    "awards": []
  },
  {
    "title": "Dune: Part One (2021)",
    "id": "1160419",
    "currentRating": 7.7,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Dune: Part Two (2024)",
    "id": "15239678",
    "currentRating": 7.91,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Dunkirk (2017)",
    "id": "5013056",
    "currentRating": 8.33,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "E.T. the Extra-Terrestrial (1982)",
    "id": "0083866",
    "currentRating": 8.17,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Eastern Promises (2007)",
    "id": "0765443",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Ed Wood (1994)",
    "id": "0109707",
    "currentRating": 7.44,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      }
    ]
  },
  {
    "title": "Edward Scissorhands (1990)",
    "id": "0099487",
    "currentRating": 7.56,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "El Laberinto del fauno (2006)",
    "id": "0457430",
    "currentRating": 8.54,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "El Secreto de sus ojos (2009)",
    "id": "1305806",
    "currentRating": 8.54,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      }
    ]
  },
  {
    "title": "Election (1999)",
    "id": "0126886",
    "currentRating": 7.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Elizabeth (1998)",
    "id": "0127536",
    "currentRating": 8.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Emma (1996)",
    "id": "0116191",
    "currentRating": 7.67,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Empire Records (1995)",
    "id": "0112950",
    "currentRating": 7,
    "awards": []
  },
  {
    "title": "Erin Brockovich (2000)",
    "id": "0195685",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Eskiya (1996)",
    "id": "0116231",
    "currentRating": 7.38,
    "awards": []
  },
  {
    "title": "Eternal Sunshine of the Spotless Mind (2004)",
    "id": "0338013",
    "currentRating": 8.94,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "EverAfter (1998)",
    "id": "0120631",
    "currentRating": 8.5,
    "awards": []
  },
  {
    "title": "Everyone Says I Love You (1996)",
    "id": "0116242",
    "currentRating": 7.5,
    "awards": []
  },
  {
    "title": "Everything Everywhere All at Once (2022)",
    "id": "6710474",
    "currentRating": 7.77,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Evil Dead II (1987)",
    "id": "0092991",
    "currentRating": 7.44,
    "awards": []
  },
  {
    "title": "Evita (1996)",
    "id": "0116250",
    "currentRating": 6.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Excalibur (1981)",
    "id": "0082348",
    "currentRating": 8.33,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Exotica (1994)",
    "id": "0109759",
    "currentRating": 7.25,
    "awards": []
  },
  {
    "title": "Eyes Wide Shut (1999)",
    "id": "0120663",
    "currentRating": 7.9,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Faa yeung nin wa (2000)",
    "id": "0118694",
    "currentRating": 7.55,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Face/Off (1997)",
    "id": "0119094",
    "currentRating": 7.92,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Fanny och Alexander (1982)",
    "id": "0083922",
    "currentRating": 7.9,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Fantasia (1940)",
    "id": "0032455",
    "currentRating": 7,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Fargo (1996)",
    "id": "0116282",
    "currentRating": 8.14,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Ferris Bueller's Day Off (1986)",
    "id": "0091042",
    "currentRating": 7.6,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Festen (1998)",
    "id": "0154420",
    "currentRating": 8.9,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Fiddler on the Roof (1971)",
    "id": "0067093",
    "currentRating": 7.33,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Field of Dreams (1989)",
    "id": "0097351",
    "currentRating": 7.8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Fight Club (1999)",
    "id": "0137523",
    "currentRating": 8.85,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Filantropica (2002)",
    "id": "0314067",
    "currentRating": 8,
    "awards": []
  },
  {
    "title": "Finding Nemo (2003)",
    "id": "0266543",
    "currentRating": 8.56,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Finding Neverland (2004)",
    "id": "0308644",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Forbidden Planet (1956)",
    "id": "0049223",
    "currentRating": 7.75,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Ford v Ferrari (2019)",
    "id": "1950186",
    "currentRating": 7.92,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Forgetting Sarah Marshall (2008)",
    "id": "0800039",
    "currentRating": 7.83,
    "awards": []
  },
  {
    "title": "Forrest Gump (1994)",
    "id": "0109830",
    "currentRating": 8.15,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Four Weddings and a Funeral (1994)",
    "id": "0109831",
    "currentRating": 7.71,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Frankenstein (1931)",
    "id": "0021884",
    "currentRating": 7.8,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Friday (1995)",
    "id": "0113118",
    "currentRating": 6.4,
    "awards": []
  },
  {
    "title": "Fried Green Tomatoes (1991)",
    "id": "0101921",
    "currentRating": 7.2,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "From Dusk Till Dawn (1996)",
    "id": "0116367",
    "currentRating": 7,
    "awards": []
  },
  {
    "title": "From Here to Eternity (1953)",
    "id": "0045793",
    "currentRating": 7.83,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Frost/Nixon (2008)",
    "id": "0870111",
    "currentRating": 7.71,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Fucking Åmål (1998)",
    "id": "0150662",
    "currentRating": 7.75,
    "awards": []
  },
  {
    "title": "Full Metal Jacket (1987)",
    "id": "0093058",
    "currentRating": 8.44,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Gallipoli (1981)",
    "id": "0082432",
    "currentRating": 8.25,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Gandhi (1982)",
    "id": "0083987",
    "currentRating": 8.56,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Gangs of Wasseypur (2012)",
    "id": "1954470",
    "currentRating": 7.5,
    "awards": []
  },
  {
    "title": "Garden State (2004)",
    "id": "0333766",
    "currentRating": 7.63,
    "awards": []
  },
  {
    "title": "Gattaca (1997)",
    "id": "0119177",
    "currentRating": 7.63,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Gekijô-ban Chensô Man Reze-hen (2025)",
    "id": "30472557",
    "currentRating": 6,
    "awards": []
  },
  {
    "title": "Gekijô-ban Kimetsu no Yaiba Mugen Jô-hen (2025)",
    "id": "32820897",
    "currentRating": 7.67,
    "awards": []
  },
  {
    "title": "Get Out (2017)",
    "id": "5052448",
    "currentRating": 8.08,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Gettysburg (1993)",
    "id": "0107007",
    "currentRating": 7,
    "awards": []
  },
  {
    "title": "Ghost Dog: The Way of the Samurai (1999)",
    "id": "0165798",
    "currentRating": 7.4,
    "awards": []
  },
  {
    "title": "Ghost World (2001)",
    "id": "0162346",
    "currentRating": 8.17,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Gisaengchung (2019)",
    "id": "6751668",
    "currentRating": 8.88,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      },
      {
        "type": "Palme d'Or",
        "status": "Nominated",
        "description": "Palme d'Or"
      }
    ]
  },
  {
    "title": "Gladiator (2000)",
    "id": "0172495",
    "currentRating": 8.68,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Glory (1989)",
    "id": "0097441",
    "currentRating": 7.88,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Go (1999)",
    "id": "0139239",
    "currentRating": 8,
    "awards": []
  },
  {
    "title": "Gods and Monsters (1998)",
    "id": "0120684",
    "currentRating": 7.67,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Gojira -1.0 (2023)",
    "id": "23289160",
    "currentRating": 8.17,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      }
    ]
  },
  {
    "title": "GoldenEye (1995)",
    "id": "0113189",
    "currentRating": 7.17,
    "awards": []
  },
  {
    "title": "Goldfinger (1964)",
    "id": "0058150",
    "currentRating": 7.73,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Gone Baby Gone (2007)",
    "id": "0452623",
    "currentRating": 8.71,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Gone Girl (2014)",
    "id": "2267998",
    "currentRating": 8.43,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Gone with the Wind (1939)",
    "id": "0031381",
    "currentRating": 7.75,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Good Will Hunting (1997)",
    "id": "0119217",
    "currentRating": 8.63,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Goodfellas (1990)",
    "id": "0099685",
    "currentRating": 8.37,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Gran Torino (2008)",
    "id": "1205489",
    "currentRating": 8.07,
    "awards": []
  },
  {
    "title": "Gravity (2013)",
    "id": "1454468",
    "currentRating": 8.36,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Great Expectations (1946)",
    "id": "0038574",
    "currentRating": 8.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Green Book (2018)",
    "id": "6966692",
    "currentRating": 8.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Grindhouse (2007)",
    "id": "0462322",
    "currentRating": 7.57,
    "awards": []
  },
  {
    "title": "Grosse Pointe Blank (1997)",
    "id": "0119229",
    "currentRating": 7.5,
    "awards": []
  },
  {
    "title": "Groundhog Day (1993)",
    "id": "0107048",
    "currentRating": 8.53,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Guardians of the Galaxy (2014)",
    "id": "2015381",
    "currentRating": 7.43,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Guardians of the Galaxy Vol. 2 (2017)",
    "id": "3896198",
    "currentRating": 7.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Guardians of the Galaxy Vol. 3 (2023)",
    "id": "6791350",
    "currentRating": 7.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Hababam Sinifi (1975)",
    "id": "0252487",
    "currentRating": 9,
    "awards": []
  },
  {
    "title": "Hababam Sinifi Uyaniyor (1977)",
    "id": "0252490",
    "currentRating": 8.67,
    "awards": []
  },
  {
    "title": "Hababam Sinifi: Sinifta Kaldi (1975)",
    "id": "0252488",
    "currentRating": 8,
    "awards": []
  },
  {
    "title": "Hable con ella (2002)",
    "id": "0287467",
    "currentRating": 8.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Hachi: A Dog's Tale (2009)",
    "id": "1028532",
    "currentRating": 7,
    "awards": []
  },
  {
    "title": "Hacksaw Ridge (2016)",
    "id": "2119532",
    "currentRating": 8.18,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Hamilton (2020)",
    "id": "8503618",
    "currentRating": 7.33,
    "awards": []
  },
  {
    "title": "Hamlet (1996)",
    "id": "0116477",
    "currentRating": 7,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Hannah and Her Sisters (1986)",
    "id": "0091167",
    "currentRating": 7.75,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Happiness (1998)",
    "id": "0147612",
    "currentRating": 8.25,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Harold and Maude (1971)",
    "id": "0067185",
    "currentRating": 7,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Harry Potter and the Chamber of Secrets (2002)",
    "id": "0295297",
    "currentRating": 7,
    "awards": []
  },
  {
    "title": "Harry Potter and the Deathly Hallows: Part 1 (2010)",
    "id": "0926084",
    "currentRating": 6.75,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Harry Potter and the Deathly Hallows: Part 2 (2011)",
    "id": "1201607",
    "currentRating": 7.61,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Harry Potter and the Half-Blood Prince (2009)",
    "id": "0417741",
    "currentRating": 7.19,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Harry Potter and the Order of the Phoenix (2007)",
    "id": "0373889",
    "currentRating": 7.25,
    "awards": []
  },
  {
    "title": "Harry Potter and the Sorcerer's Stone (2001)",
    "id": "0241527",
    "currentRating": 7.25,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Harvey (1950)",
    "id": "0042546",
    "currentRating": 8.33,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Hauru no ugoku shiro (2004)",
    "id": "0347149",
    "currentRating": 8.31,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Heat (1995)",
    "id": "0113277",
    "currentRating": 8.23,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Heathers (1988)",
    "id": "0097493",
    "currentRating": 7,
    "awards": []
  },
  {
    "title": "Heavenly Creatures (1994)",
    "id": "0110005",
    "currentRating": 8.13,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Henry V (1989)",
    "id": "0097499",
    "currentRating": 7.67,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Her (2013)",
    "id": "1798709",
    "currentRating": 7.67,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Hera Pheri (2000)",
    "id": "0242519",
    "currentRating": 5.6,
    "awards": []
  },
  {
    "title": "High Fidelity (2000)",
    "id": "0146882",
    "currentRating": 7.6,
    "awards": []
  },
  {
    "title": "High Noon (1952)",
    "id": "0044706",
    "currentRating": 8.27,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Highlander (1986)",
    "id": "0091203",
    "currentRating": 8.4,
    "awards": []
  },
  {
    "title": "His Girl Friday (1940)",
    "id": "0032599",
    "currentRating": 9,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Hoop Dreams (1994)",
    "id": "0110057",
    "currentRating": 8,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Höstsonaten (1978)",
    "id": "0077711",
    "currentRating": 7.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Hot Fuzz (2007)",
    "id": "0425112",
    "currentRating": 8.5,
    "awards": []
  },
  {
    "title": "Hotaru no haka (1988)",
    "id": "0095327",
    "currentRating": 8.2,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Hotel Rwanda (2004)",
    "id": "0395169",
    "currentRating": 8.17,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "How the Grinch Stole Christmas! (1966)",
    "id": "0060345",
    "currentRating": 6.6,
    "awards": []
  },
  {
    "title": "How to Train Your Dragon (2010)",
    "id": "0892769",
    "currentRating": 8.27,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "How to Train Your Dragon 2 (2014)",
    "id": "1646971",
    "currentRating": 7.75,
    "awards": [
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Howards End (1992)",
    "id": "0104454",
    "currentRating": 7.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      }
    ]
  },
  {
    "title": "Hugo (2011)",
    "id": "0970179",
    "currentRating": 7.5,
    "awards": [
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Won",
        "description": "Won Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "Oscar",
        "status": "Nominated",
        "description": "Nominated to Oscar"
      },
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Hung fan kui (1995)",
    "id": "0113326",
    "currentRating": 7.5,
    "awards": []
  },
  {
    "title": "Idi i smotri (1985)",
    "id": "0091251",
    "currentRating": 7.29,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  },
  {
    "title": "Ikiru (1952)",
    "id": "0044741",
    "currentRating": 8.29,
    "awards": [
      {
        "type": "1001 Movies You Must See Before You Die",
        "status": "Nominated",
        "description": "From '1001 Movies You Must See Before You Die' List"
      }
    ]
  }
];