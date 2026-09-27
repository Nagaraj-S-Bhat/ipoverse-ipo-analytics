import { prisma } from '../lib/prisma';
import {
  Prisma,
  type IPO,
  IPOType,
  IPOStatus,
} from '@prisma/client';

export class IpoRepository {
  /**
   * Find an IPO by its unique slug.
   */
  async findBySlug(slug: string) {
    return prisma.iPO.findFirst({
      where: {
        slug,
        isDeleted: false,
      },
      include: {
        listingPerformance: true,

        gmpHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 30,
        },

        subscriptionHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 10,
        },
      },
    });
  }

  /**
   * Find an IPO by symbol.
   */
  async findBySymbol(
    symbol: string
  ): Promise<IPO | null> {
    return prisma.iPO.findFirst({
      where: {
        symbol,
        isDeleted: false,
      },
      include: {
        listingPerformance: true,
        gmpHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 30,
        },
        subscriptionHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 10,
        },
      },
    });
  }

  /**
   * Find IPO by exact company name.
   */
  async findByCompanyName(
    companyName: string
  ): Promise<IPO | null> {
    return prisma.iPO.findFirst({
      where: {
        companyName: {
          equals: companyName,
          mode: 'insensitive',
        },
        isDeleted: false,
      },
      include: {
        listingPerformance: true,
        gmpHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 30,
        },
        subscriptionHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 10,
        },
      },
    });
  }

  /**
   * Create/update an IPO by slug.
   */
  async upsertIpo(
    slug: string,
    createData: Prisma.IPOCreateInput,
    updateData: Prisma.IPOUpdateInput
  ): Promise<IPO> {
    return prisma.iPO.upsert({
      where: {
        slug,
      },
      create: createData,
      update: updateData,
    });
  }

  /**
   * Create GMP history record.
   */
  async createGmpHistory(
    gmpData: Prisma.GMPHistoryUncheckedCreateInput
  ) {
    return prisma.gMPHistory.create({
      data: gmpData,
    });
  }

  /**
   * Create subscription history record.
   */
  async createSubscriptionHistory(
    subData: Prisma.SubscriptionHistoryUncheckedCreateInput
  ) {
    return prisma.subscriptionHistory.create({
      data: subData,
    });
  }

  /**
   * Upsert listing performance.
   */
  async upsertListingPerformance(
    ipoId: string,
    createData: Omit<
      Prisma.ListingPerformanceUncheckedCreateInput,
      'ipoId'
    >,
    updateData: Prisma.ListingPerformanceUpdateInput
  ) {
    return prisma.listingPerformance.upsert({
      where: {
        ipoId,
      },
      create: {
        ...createData,
        ipoId,
      },
      update: updateData,
    });
  }

  // ============================================================
  // PUBLIC API QUERIES
  // ============================================================

  /**
   * Search/filter/paginate IPOs.
   */
  async findMany(params: {
    page: number;
    limit: number;
    search?: string;
    type?: IPOType;
    status?: IPOStatus;
    sort?: string;
  }) {
    const {
      page,
      limit,
      search,
      type,
      status,
      sort,
    } = params;

    const safePage =
      Math.max(1, page);

    const safeLimit =
      Math.min(
        Math.max(1, limit),
        100
      );

    const skip =
      (safePage - 1) * safeLimit;

    const whereClause:
      Prisma.IPOWhereInput = {
      isDeleted: false,
    };

    if (type) {
      whereClause.type = type;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search?.trim()) {
      const searchText =
        search.trim();

      whereClause.OR = [
        {
          companyName: {
            contains: searchText,
            mode: 'insensitive',
          },
        },
        {
          symbol: {
            contains: searchText,
            mode: 'insensitive',
          },
        },
        {
          sector: {
            contains: searchText,
            mode: 'insensitive',
          },
        },
        {
          searchKeywords: {
            contains: searchText,
            mode: 'insensitive',
          },
        },
      ];
    }

    let orderByClause:
      Prisma.IPOOrderByWithRelationInput = {
      openDate: 'desc',
    };

    if (sort) {
      const [
        field,
        direction,
      ] = sort.split(':');

      const sortDirection:
        Prisma.SortOrder =
        direction?.toLowerCase() === 'asc'
          ? 'asc'
          : 'desc';

      switch (field) {
        case 'name':
          orderByClause = {
            companyName:
              sortDirection,
          };
          break;

        case 'date':
          orderByClause = {
            openDate:
              sortDirection,
          };
          break;

        case 'size':
          orderByClause = {
            issueSizeCr:
              sortDirection,
          };
          break;

        case 'price':
          orderByClause = {
            priceMax:
              sortDirection,
          };
          break;

        case 'listing':
          orderByClause = {
            listingDate:
              sortDirection,
          };
          break;
      }
    }

    const [
      ipos,
      total,
    ] = await Promise.all([
      prisma.iPO.findMany({
        where: whereClause,

        orderBy:
          orderByClause,

        skip,

        take:
          safeLimit,

        include: {
          listingPerformance: true,

          gmpHistory: {
            orderBy: {
              recordedAt: 'desc',
            },
            take: 1,
          },

          subscriptionHistory: {
            orderBy: {
              recordedAt: 'desc',
            },
            take: 1,
          },
        },
      }),

      prisma.iPO.count({
        where: whereClause,
      }),
    ]);

    return {
      ipos,
      total,
    };
  }

  /**
   * Live GMP page.
   *
   * Returns ONLY IPOs that are currently present in the
   * "Live IPO GMP" Google Sheet (isLiveGmp = true).
   *
   * The isLiveGmp flag is set by syncLiveGMP() and cleared
   * for any IPO that was removed from the sheet since the
   * last sync. This prevents stale records from appearing
   * even if their status happens to be UPCOMING/OPEN/CLOSED.
   *
   * Ordered by currentGmpPercent DESC NULLS LAST so the
   * highest GMP % IPO appears first (matches sheet column D).
   */
  async findLiveGMP() {
    return prisma.iPO.findMany({
      where: {
        isDeleted: false,
        isLiveGmp: true,
      },

      include: {
        gmpHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1,
        },

        subscriptionHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1,
        },
      },

      orderBy: [
        {
          currentGmpPercent: { sort: 'desc', nulls: 'last' },
        },
        {
          companyName: 'asc',
        },
      ],
    });
  }


  /**
   * Mainboard IPO page.
   */
  async findMainboard() {
    return prisma.iPO.findMany({
      where: {
        isDeleted: false,
        isCurrentMainboard: true,
      },

      include: {
        gmpHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1,
        },

        subscriptionHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1,
        },

        listingPerformance: true,
      },

      orderBy: [
        {
          openDate: { sort: 'desc', nulls: 'last' },
        },
        {
          companyName: 'asc',
        },
      ],
    });
  }

  /**
   * SME IPO page.
   */
  async findSME() {
    return prisma.iPO.findMany({
      where: {
        isDeleted: false,
        isCurrentSme: true,
      },

      include: {
        gmpHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1,
        },

        subscriptionHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1,
        },

        listingPerformance: true,
      },

      orderBy: [
        {
          openDate: { sort: 'desc', nulls: 'last' },
        },
        {
          companyName: 'asc',
        },
      ],
    });
  }

  /**
   * Performance page.
   *
   * Ordered by sheetRowOrder ASC to match the Google Sheet's
   * newest-first ordering (the sheet is structured newest at top).
   * Falls back to listingDate DESC if sheetRowOrder is not set.
   */
  async findPerformance(
    type: IPOType
  ) {
    return prisma.iPO.findMany({
      where: {
        type,

        status:
          IPOStatus.LISTED,

        isDeleted: false,

        listingPerformance: {
          isNot: null,
        },
      },

      include: {
        listingPerformance: true,

        gmpHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1,
        },
      },

      orderBy: [
        {
          sheetRowOrder: { sort: 'asc', nulls: 'last' },
        },
        {
          listingDate: 'desc',
        },
      ],
    });
  }

  /**
   * Live Summary page.
   *
   * Returns all IPOs with isLiveSummary = true.
   * Ordering is done at the API route level:
   *   1. Open IPOs ordered by closeDate ASC (nearest closing first)
   *   2. Upcoming IPOs ordered by openDate ASC
   */
  async findLiveSummary() {
    return prisma.iPO.findMany({
      where: {
        isLiveSummary: true,
        isDeleted: false,
      },

      include: {
        subscriptionHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1,
        },

        gmpHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1,
        },

        listingPerformance: true,
      },
    });
  }

  /**
   * Fetch one complete IPO by ID.
   */
  async findById(
    id: string
  ): Promise<IPO | null> {
    return prisma.iPO.findFirst({
      where: {
        id,
        isDeleted: false,
      },

      include: {
        listingPerformance: true,

        gmpHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 100,
        },

        subscriptionHistory: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 100,
        },
      },
    });
  }

  /**
   * Dashboard statistics.
   */
  async getDashboardStats() {
    const activeFilter:
      Prisma.IPOWhereInput = {
      isDeleted: false,
    };

    const [
      openCount,
      upcomingCount,
      liveGmp,
    ] = await Promise.all([
      prisma.iPO.count({
        where: {
          ...activeFilter,
          status: IPOStatus.OPEN,
        },
      }),

      prisma.iPO.count({
        where: {
          ...activeFilter,
          status: IPOStatus.UPCOMING,
        },
      }),

      prisma.iPO.findMany({
        where: {
          ...activeFilter,

          status: {
            in: [
              IPOStatus.UPCOMING,
              IPOStatus.OPEN,
              IPOStatus.CLOSED,
            ],
          },

          gmpHistory: {
            some: {},
          },
        },

        include: {
          gmpHistory: {
            orderBy: {
              recordedAt: 'desc',
            },
            take: 1,
          },
        },
      }),
    ]);

    const gmpValues =
      liveGmp
        .map(
          (ipo) =>
            ipo.gmpHistory[0]?.gmp
        )
        .filter(
          (
            value
          ): value is Prisma.Decimal =>
            value !== undefined &&
            value !== null
        );

    let averageGmp =
      new Prisma.Decimal(0);

    let highestGmp =
      new Prisma.Decimal(0);

    if (gmpValues.length > 0) {
      const total =
        gmpValues.reduce(
          (sum, value) =>
            sum.add(value),
          new Prisma.Decimal(0)
        );

      averageGmp =
        total.div(
          gmpValues.length
        );

      highestGmp =
        gmpValues.reduce(
          (highest, value) =>
            value.gt(highest)
              ? value
              : highest,
          new Prisma.Decimal(0)
        );
    }

    return {
      openCount,
      upcomingCount,
      averageGmp,
      highestGmp,
    };
  }
}