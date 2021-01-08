import json
import os
import numpy as np
import matplotlib.pyplot as plot 

dirname = os.path.dirname(__file__)
resultpath = os.path.join(dirname, '../src/resources/testcases/results.json')

labels = []
plotdata = {}
with open(resultpath) as json_file:
    data = json.load(json_file)
    # iterate over algorithms
    for alg in data:
        plotdata[alg] = {'x': [], 'fetches':[], 'creation': []}
        labels.append(alg)
        algdata = data[alg]
        for dataset in algdata:
            results = []
            for result in algdata[dataset]['testcases']:
                results.append(result['fetches'])

            plotdata[alg]['x'].append(int(dataset))
            plotdata[alg]['fetches'].append(np.mean(results))
            plotdata[alg]['creation'].append(algdata[dataset]['indexCreation'])


for alg in labels:
    x = plotdata[alg]['x'][:]
    creation = plotdata[alg]['creation']
    xcreation = zip(x, creation)
    creation = [element for _, element in sorted(xcreation)]
    x.sort()

    plot.plot(x, creation, label = alg)
plot.legend(loc='upper left')
plot.title("setup time")
plot.savefig('out/creation.pdf')
plot.clf()


for alg in labels:
    x = plotdata[alg]['x'][:]
    fetches = plotdata[alg]['fetches']
    xfetches = zip(x,fetches)
    fetches = [element for _, element in sorted(xfetches)]
    x.sort()

    plot.plot(x, fetches, label = alg)
plot.legend(loc='upper left')
plot.title("#fetches")
plot.savefig('out/fetches.pdf')
plot.clf()

