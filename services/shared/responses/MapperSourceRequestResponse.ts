import { ISource } from '../../mapper/src/models/db/SourceModel';

export interface MapperSourceRequestResponse {
  message?: string;
  source?: ISource;
  updateRequest: boolean;
}
