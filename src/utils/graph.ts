import { DocumentNode } from "graphql";

export interface SGQueryParameters {
  /**
   * Id of this chart.
   */
  id: string;
  /**
   * The field in the GraphQL request that corresponds to a timestamp. Usually "createdAt" or "timestamp".
   */
  timeScaleKey: string;
  /**
   * The field in the GraphQL request that corresponds to the value that will be charted.
   */
  priceScaleKey: string;
  /**
   * Which subgraph to use
   */
  context: "pinto" | "pintostalk";
  /**
   * The document of the GraphQL query.
   */
  document: DocumentNode;
  /**
   * The entity that contains the data in your GraphQL request. Usually "seasons".
   */
  documentEntity: string;
}
