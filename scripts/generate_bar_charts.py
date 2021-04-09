import json
import os
import numpy as np
import matplotlib.pyplot as plt

from pathlib import Path


def ensure_dir(file_path):
    dirname = '/'.join(file_path.split('/')[:-1])
    Path(dirname).mkdir(parents=True, exist_ok=True)


def plot_bar(result_file, dataset, querytype):
    dirname = os.path.dirname(__file__)
    resultpath = os.path.join(
        dirname, '../src/resources/testcases/results/' + result_file + '.json')

    DATASET = dataset
    ALGS = ['optimum', 'resourceTypeIndex',
            'referenceIndexNew', 'referenceIndex', 'bruteForce']
    REV_ALGS = reversed(ALGS)
    NETWORKS = ['Cable', '4G', 'Fast 3G', 'Regular 3G', 'Slow 3G']

    # webpagetest.org/easy
    # latency in ms, speed in Mbps
    networks = {
        'Slow 3G': {'latency': 400, 'rate': 0.4},
        'Regular 3G': {'latency': 300, 'rate': 1.5},
        'Fast 3G': {'latency': 150, 'rate': 1.6},
        '4G': {'latency': 170, 'rate': 9.0},
        'Cable': {'latency': 28, 'rate': 5.0},
    }

    plot_options = {
        'bruteForce': {
            'linestyle': "solid",
            'color': 'r',
            'name': 'Brute Force'
        },
        'referenceIndex': {
            'linestyle': "dashed",
            'color': 'b',
            'name': 'References'
        },
        'referenceIndexNew': {
            'linestyle': "dotted",
            'color': 'c',
            'name': 'References 2.0'
        },
        'resourceTypeIndex': {
            'linestyle': 'dashdot',
            'color': 'm',
            'name': 'ResourceType'

        },
        'optimum': {
            'linestyle': "solid",
            'color': 'g',
            'name': 'Optimum'
        }
    }

    with open(resultpath) as json_file:
        processeddata = {}
        data = json.load(json_file)
        for alg in data:
            algdata = data[alg][DATASET]
            times = []
            calls = []
            datasizes = []
            indexsizes = []
            for testcase in algdata['testcases']:
                if testcase['query'].startswith(querytype):
                    times.append(testcase['time'])
                    calls.append(testcase['networkCalls'])
                    datasizes.append(testcase['dataSize'])
                    indexsizes.append(testcase['indexSize'])
            avgtime = 0  # np.mean(times)
            avgcalls = np.mean(calls)
            avgdatasize = np.mean(datasizes)
            avgindexsize = np.mean(indexsizes)

            networktimes = []
            for network in NETWORKS:
                latency_sec = networks[network]['latency'] / 1000
                # sec
                latency_index = 1 * latency_sec if avgindexsize != 0 else 0
                # Byte / (Mbit/sec / 8 * 1000000 = Byte/Sec) = Sec + Sec
                downloadtime_index = (avgindexsize) / \
                    (networks[network]['rate'] / 8 * 1000000) + latency_index

                # Sec
                latency_data = float(avgcalls * latency_sec)
                # Byte / (Mbit/sec / 8 * 1000000 = Byte/Sec) = Sec + Sec
                downloadtime_data = (avgdatasize) / \
                    (networks[network]['rate'] / 8 * 1000000) + latency_data
                networktimes.append(
                    downloadtime_data + downloadtime_index + avgtime / 1000)

                # # datasize in byte, networktime in Mbit/s
                # # Mbit/s / 8 = MByte/s * 1000000 = Byte/s
                # networktime = avgdatasize / \
                #     (networks[network]['rate'] / 8 * 1000000)
                # latency = avgcalls * networks[network]['latency']
                # totaltime = networktime + (avgtime / 1000) + (latency / 1000)
                # print('BAR', alg, downloadtime_data +
                #       downloadtime_index + avgtime / 1000, totaltime)
                # networktimes.append(totaltime)
            processeddata[alg] = networktimes

        bars = []
        barwidth = 0.15
        prev = None
        for alg in REV_ALGS:
            algdata = processeddata[alg]
            r = np.arange(len(algdata)) if prev is None else [
                x - barwidth for x in prev]
            prev = r
            plt.bar(r, algdata, width=barwidth, label=plot_options[alg]['name'],
                    color=plot_options[alg]['color'])

        plt.axhline(y=1, linewidth=1, color='gray')
        plt.axhline(y=0.1, linewidth=1, color='gray')
        plt.xticks([r - barwidth for r in range(len(prev))], NETWORKS)

        plt.legend(loc='upper left')
        plt.ylabel('Avg. Query Time in Seconds')

        # plt.yscale('symlog', linthreshy=0.01)
        plt.grid(True, axis='y', which='both')

        plt.subplots_adjust(left=0.1, right=0.95, top=0.95, bottom=0.1)

        title = '/networks/' + querytype + '_' +\
            DATASET if querytype else '/networks/avg_' + DATASET
        pdfpath = 'out/charts/pdf/' + title + '.pdf'
        pngpath = 'out/charts/png/' + title + '.png'
        ensure_dir(pdfpath)
        ensure_dir(pngpath)
        plt.savefig(pdfpath, dpi=300)
        plt.savefig(pngpath, dpi=300)
        plt.clf()


def plot_bars(result_file, dataset):
    querytypes = ['', 'has', 'ref', 'res', 'val']
    for querytype in querytypes:
        plot_bar(result_file, dataset, querytype)
